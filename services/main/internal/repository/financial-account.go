package repository

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type GetFinancialAccountQuery struct {
	ID                  *string
	TenantApplicationID *string
	TenantID            *string
	PropertyID          *string
	// Statuses restricts the lookup to a set — resolution passes
	// {ACTIVE, CLOSURE_ELIGIBLE}, since an eligible account is still reusable.
	Statuses *[]string
	Populate *[]string
}

type FinancialAccountRepository interface {
	Create(ctx context.Context, account *models.FinancialAccount) error
	GetOne(ctx context.Context, query GetFinancialAccountQuery) (*models.FinancialAccount, error)
	Update(ctx context.Context, account *models.FinancialAccount) error
	// ListActiveForBilling returns every ACTIVE account whose cadence is not
	// MANUAL. Selection of which charges to bill happens in the pure
	// financials.SelectIssuableCharges, not here — the repository must not
	// pre-filter by due date or the cadence quantity would be capped by the
	// lead window.
	ListActiveForBilling(ctx context.Context) (*[]models.FinancialAccount, error)
	ListDueForClosure(ctx context.Context, eligibleBefore time.Time) (*[]models.FinancialAccount, error)
	// SumSuccessfulPayments totals every successful payment made against this
	// account's invoices. It must go through invoices rather than through
	// allocations: a fully unallocated overpayment has no allocation rows at
	// all, and that residue is precisely what account credit is.
	SumSuccessfulPayments(ctx context.Context, financialAccountID string) (int64, error)
}

type financialAccountRepository struct {
	DB *gorm.DB
}

func NewFinancialAccountRepository(db *gorm.DB) FinancialAccountRepository {
	return &financialAccountRepository{DB: db}
}

func (r *financialAccountRepository) Create(ctx context.Context, account *models.FinancialAccount) error {
	return lib.ResolveDB(ctx, r.DB).Create(account).Error
}

func (r *financialAccountRepository) Update(ctx context.Context, account *models.FinancialAccount) error {
	return lib.ResolveDB(ctx, r.DB).Save(account).Error
}

func (r *financialAccountRepository) GetOne(
	ctx context.Context,
	query GetFinancialAccountQuery,
) (*models.FinancialAccount, error) {
	var account models.FinancialAccount

	db := applyFinancialAccountQuery(lib.ResolveDB(ctx, r.DB).Model(&models.FinancialAccount{}), query)

	if err := db.First(&account).Error; err != nil {
		return nil, err
	}

	return &account, nil
}

// applyFinancialAccountQuery is extracted so GetOne and its tests render the
// same predicates.
func applyFinancialAccountQuery(db *gorm.DB, query GetFinancialAccountQuery) *gorm.DB {
	if query.Populate != nil {
		for _, populate := range *query.Populate {
			db = db.Preload(populate)
		}
	}

	if query.ID != nil {
		db = db.Where("financial_accounts.id = ?", *query.ID)
	}
	if query.TenantApplicationID != nil {
		db = db.Where("financial_accounts.tenant_application_id = ?", *query.TenantApplicationID)
	}
	if query.TenantID != nil {
		db = db.Where("financial_accounts.tenant_id = ?", *query.TenantID)
	}
	if query.PropertyID != nil {
		db = db.Where("financial_accounts.property_id = ?", *query.PropertyID)
	}
	if query.Statuses != nil {
		db = db.Where("financial_accounts.status IN ?", *query.Statuses)
	}

	return db
}

func (r *financialAccountRepository) SumSuccessfulPayments(
	ctx context.Context,
	financialAccountID string,
) (int64, error) {
	var total *int64
	err := lib.ResolveDB(ctx, r.DB).
		Model(&models.Payment{}).
		Joins("JOIN invoices i ON i.id = payments.invoice_id").
		Where("i.financial_account_id = ?", financialAccountID).
		Where("payments.status = ?", "SUCCESSFUL").
		Where("payments.deleted_at IS NULL").
		Select("COALESCE(SUM(payments.amount), 0)").
		Scan(&total).Error
	if err != nil {
		return 0, err
	}
	if total == nil {
		return 0, nil
	}
	return *total, nil
}

// ListDueForClosure returns accounts whose leases have all ended and which
// have sat eligible for at least the grace period.
//
// The gates are NOT applied here — money is the service's question, and a
// repository that filtered on it would duplicate EvaluateClosureGates in SQL.
func (r *financialAccountRepository) ListDueForClosure(
	ctx context.Context,
	eligibleBefore time.Time,
) (*[]models.FinancialAccount, error) {
	var accounts []models.FinancialAccount

	err := lib.ResolveDB(ctx, r.DB).
		Model(&models.FinancialAccount{}).
		Where("financial_accounts.status = ?", "CLOSURE_ELIGIBLE").
		Where("financial_accounts.closure_eligible_at IS NOT NULL").
		Where("financial_accounts.closure_eligible_at <= ?", eligibleBefore).
		Find(&accounts).Error
	if err != nil {
		return nil, err
	}

	return &accounts, nil
}

func (r *financialAccountRepository) ListActiveForBilling(
	ctx context.Context,
) (*[]models.FinancialAccount, error) {
	var accounts []models.FinancialAccount

	err := lib.ResolveDB(ctx, r.DB).
		Model(&models.FinancialAccount{}).
		Where("financial_accounts.status IN ?", []string{"ACTIVE", "CLOSURE_ELIGIBLE"}).
		Where("financial_accounts.rent_billing_cadence != ?", "MANUAL").
		Find(&accounts).Error
	if err != nil {
		return nil, err
	}

	return &accounts, nil
}
