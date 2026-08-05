package jobs

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/services/financials"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// BackfillFinancialAccounts is Job 2: it gives every tenant application a
// financial account, materialises its charges, reattaches existing invoices to
// those charges, and rebuilds allocations from successful payments.
//
// It is additive and idempotent — an application that already has an account is
// skipped, so a partial run can be repeated. The destructive changes live in
// DropLegacyFinancialColumns and must not run until this verifies clean against
// a production dump.
func BackfillFinancialAccounts() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608050002_BACKFILL_FINANCIAL_ACCOUNTS",
		Migrate: func(db *gorm.DB) error {
			var applications []models.TenantApplication
			if err := db.Where("deleted_at IS NULL").
				Order("created_at ASC").
				Find(&applications).Error; err != nil {
				return err
			}

			for i := range applications {
				if err := backfillOneApplication(db, &applications[i]); err != nil {
					return err
				}
			}

			// Expense-derived invoices survive this change but lose their only
			// route to a property once context_expense_id is dropped. Without
			// this they fall out of the Cube property scope and historical
			// revenue silently drops for any client who recharged expenses.
			return db.Exec(`
				UPDATE invoices i
				SET payer_property_id = e.property_id
				FROM expenses e
				WHERE i.context_expense_id = e.id
				  AND i.payer_property_id IS NULL
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			statements := []string{
				`UPDATE invoice_line_items SET charge_instance_id = NULL`,
				`UPDATE invoices SET financial_account_id = NULL`,
				`DELETE FROM payment_allocations`,
				`DELETE FROM charge_instances`,
				`DELETE FROM charge_definitions`,
				`DELETE FROM financial_accounts`,
			}
			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}
			return nil
		},
	}
}

func backfillOneApplication(db *gorm.DB, app *models.TenantApplication) error {
	appID := app.ID.String()

	// Idempotent: a partial run can be repeated safely.
	var existing int64
	if err := db.Model(&models.FinancialAccount{}).
		Where("tenant_application_id = ?", appID).
		Count(&existing).Error; err != nil {
		return err
	}
	if existing > 0 {
		return nil
	}

	// Applications without agreed rent terms have nothing to materialise. They
	// get no account; any invoice against them stays unlinked and is caught by
	// the verification gate before Job 3 runs.
	if app.RentFee == nil || app.PaymentFrequency == nil {
		return nil
	}

	var lease models.Lease
	hasLease := db.Where("tenant_application_id = ? AND deleted_at IS NULL", appID).
		First(&lease).Error == nil

	// Prefer the lease's dates once approved — they are the ones that actually
	// govern billing.
	moveIn := app.DesiredMoveInDate
	stayDuration := app.StayDuration
	stayFrequency := app.StayDurationFrequency
	rentFee := *app.RentFee
	paymentFrequency := *app.PaymentFrequency
	if hasLease {
		moveIn = &lease.MoveInDate
		stayDuration = &lease.StayDuration
		stayFrequency = &lease.StayDurationFrequency
		rentFee = lease.RentFee
		if lease.PaymentFrequency != nil {
			paymentFrequency = *lease.PaymentFrequency
		}
	}
	if moveIn == nil || stayDuration == nil || stayFrequency == nil {
		return nil
	}

	currency := "GHS"
	if app.RentFeeCurrency != nil {
		currency = *app.RentFeeCurrency
	}

	var initialDeposit, securityDeposit int64
	if app.InitialDepositFee != nil {
		initialDeposit = *app.InitialDepositFee
	}
	if app.SecurityDepositFee != nil {
		securityDeposit = *app.SecurityDepositFee
	}

	// The initial deposit is advance rent, so it becomes the billing cadence
	// and produces NO charge of its own. A charge for it would double-count
	// against the rent instances covering the same periods.
	policy := financials.DeriveRentBillingPolicy(initialDeposit, rentFee)

	account := &models.FinancialAccount{
		TenantApplicationID: appID,
		Currency:            currency,
		RentBillingCadence:  policy.Cadence,
		RentBillingInterval: policy.Interval,
		AutoIssueDaysBefore: 5,
		Status:              "ACTIVE",
	}
	account.PropertyID = app.PropertyId
	if hasLease {
		leaseID := lease.ID.String()
		account.LeaseID = &leaseID
		account.TenantID = &lease.TenantId
	}
	if clientID := resolveClientID(db, app); clientID != nil {
		account.ClientID = clientID
	}

	if err := db.Create(account).Error; err != nil {
		return err
	}
	accountID := account.ID.String()

	if err := createDefinitionsAndInstances(db, accountID, definitionsInput{
		RentFee:               rentFee,
		Currency:              currency,
		PaymentFrequency:      paymentFrequency,
		MoveInDate:            *moveIn,
		StayDuration:          *stayDuration,
		StayDurationFrequency: *stayFrequency,
		SecurityDepositFee:    securityDeposit,
	}); err != nil {
		return err
	}

	return reattachInvoices(db, accountID, appID, hasLease, lease.ID.String())
}

func resolveClientID(db *gorm.DB, app *models.TenantApplication) *string {
	if app.PropertyId == nil {
		return nil
	}
	var property models.Property
	if err := db.Where("id = ?", *app.PropertyId).First(&property).Error; err != nil {
		return nil
	}
	return &property.ClientID
}

type definitionsInput struct {
	RentFee               int64
	Currency              string
	PaymentFrequency      string
	MoveInDate            time.Time
	StayDuration          int64
	StayDurationFrequency string
	SecurityDepositFee    int64
}

func createDefinitionsAndInstances(db *gorm.DB, accountID string, in definitionsInput) error {
	rentDefinition := &models.ChargeDefinition{
		FinancialAccountID: accountID,
		Name:               "Rent",
		Category:           financials.CategoryRent,
		Amount:             in.RentFee,
		Currency:           in.Currency,
		Frequency:          in.PaymentFrequency,
		StartDate:          &in.MoveInDate,
		Status:             "ACTIVE",
	}
	if err := db.Create(rentDefinition).Error; err != nil {
		return err
	}

	// Reuse the live materialiser so backfilled due dates carry the same
	// payment-grace offset as the invoices tenants have already received.
	drafts, err := financials.MaterialiseRentInstances(financials.MaterialiseRentInput{
		RentFee:               in.RentFee,
		Currency:              in.Currency,
		PaymentFrequency:      in.PaymentFrequency,
		MoveInDate:            in.MoveInDate,
		StayDuration:          in.StayDuration,
		StayDurationFrequency: in.StayDurationFrequency,
	})
	if err != nil {
		return err
	}

	definitionID := rentDefinition.ID.String()
	instances := make([]models.ChargeInstance, 0, len(drafts)+1)
	for _, draft := range drafts {
		periodStart := draft.PeriodStart
		periodEnd := draft.PeriodEnd
		instances = append(instances, models.ChargeInstance{
			FinancialAccountID: accountID,
			ChargeDefinitionID: &definitionID,
			Name:               draft.Name,
			Category:           draft.Category,
			Amount:             draft.Amount,
			Currency:           draft.Currency,
			PeriodStart:        &periodStart,
			PeriodEnd:          &periodEnd,
			DueDate:            draft.DueDate,
		})
	}

	if in.SecurityDepositFee > 0 {
		depositDefinition := &models.ChargeDefinition{
			FinancialAccountID: accountID,
			Name:               "Security Deposit",
			Category:           financials.CategorySecurityDeposit,
			Amount:             in.SecurityDepositFee,
			Currency:           in.Currency,
			Frequency:          "ONCE",
			Status:             "ACTIVE",
		}
		if defErr := db.Create(depositDefinition).Error; defErr != nil {
			return defErr
		}
		depositID := depositDefinition.ID.String()
		instances = append(instances, models.ChargeInstance{
			FinancialAccountID: accountID,
			ChargeDefinitionID: &depositID,
			Name:               "Security Deposit",
			Category:           financials.CategorySecurityDeposit,
			Amount:             in.SecurityDepositFee,
			Currency:           in.Currency,
			DueDate:            in.MoveInDate,
		})
	}

	if len(instances) == 0 {
		return nil
	}
	return db.Create(&instances).Error
}
