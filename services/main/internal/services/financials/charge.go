package financials

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

// ToChargeView projects a persisted instance onto the value type the pure
// arithmetic operates on.
func ToChargeView(m models.ChargeInstance) ChargeView {
	return ChargeView{
		ID:             m.ID.String(),
		LeaseID:        m.LeaseID,
		Category:       m.Category,
		Amount:         m.Amount,
		DueDate:        m.DueDate,
		InvoicedAmount: m.InvoicedAmount,
		SettledAmount:  m.SettledAmount,
	}
}

// RentTermsLocked reports whether the rent schedule can still be rebuilt.
//
// This is the same question RederiveRent answers internally, exposed so the UI
// can stop offering an edit the service is going to refuse. Rent-scoped
// deliberately: only rent derives from the move-in date and unit, so a billed
// deposit must not freeze them. Keep this in step with RederiveRent — the two
// disagreeing is worse than either rule alone, because the screen would then
// promise something the API rejects.
func RentTermsLocked(views []ChargeView) bool {
	rentOnly := make([]ChargeView, 0, len(views))
	for _, v := range views {
		if v.Category == CategoryRent {
			rentOnly = append(rentOnly, v)
		}
	}
	return HasDirtyInstances(rentOnly)
}

// HasDirtyInstances reports whether any charge has been invoiced or settled.
// A dirty ledger cannot be regenerated from changed terms — an existing
// invoice line would be orphaned and the tenant would have seen a figure the
// system no longer believes.
func HasDirtyInstances(views []ChargeView) bool {
	for _, v := range views {
		if v.InvoicedAmount != 0 || v.SettledAmount != 0 {
			return true
		}
	}
	return false
}

type MaterialiseForAccountInput struct {
	FinancialAccountID string
	// LeaseID scopes everything this call creates to one contractual term.
	// Nil for application-stage preparation, where no lease exists yet —
	// approval stamps those afterwards via ScopeUnassignedToLease.
	LeaseID               *string
	RentFee               int64
	Currency              string
	PaymentFrequency      string
	MoveInDate            time.Time
	StayDuration          int64
	StayDurationFrequency string
	SecurityDepositFee    int64
	SecurityDepositDue    time.Time
}

type CreateAdHocChargeInput struct {
	FinancialAccountID string
	// LeaseID scopes the charge to a contractual term. Nil is meaningful and
	// common: an account credit, a write-off or a goodwill discount belongs to
	// the relationship rather than to any one term.
	LeaseID                  *string
	Name                     string
	Category                 string
	Amount                   int64 // signed
	Currency                 string
	DueDate                  time.Time
	ReversesChargeInstanceID *string
}

type VoidChargeInput struct {
	ChargeInstanceID string
	Reason           string
}

type RederiveRentInput struct {
	FinancialAccountID    string
	RentFee               int64
	Currency              string
	PaymentFrequency      string
	MoveInDate            time.Time
	StayDuration          int64
	StayDurationFrequency string
}

type ChargeService interface {
	MaterialiseForAccount(ctx context.Context, input MaterialiseForAccountInput) error
	CreateAdHoc(ctx context.Context, input CreateAdHocChargeInput) (*models.ChargeInstance, error)
	VoidInstance(ctx context.Context, input VoidChargeInput) error
	RederiveRent(ctx context.Context, input RederiveRentInput) error
	// ScopeUnassignedToLease gives an application's charges the contractual
	// context of the lease that application became.
	ScopeUnassignedToLease(ctx context.Context, financialAccountID, leaseID string) error
	// CloseDefinitionsForLease marks a term's rent definitions CLOSED, so a
	// renewal does not leave a second ACTIVE template behind and the account
	// keeps exactly one answer to "what is the rent?".
	CloseDefinitionsForLease(ctx context.Context, financialAccountID, leaseID string) error
	ListViews(ctx context.Context, financialAccountID string) ([]ChargeView, error)
	// ListInstances returns the persisted models. The transformation layer
	// needs Name, Currency and VoidedAt, which ChargeView deliberately does
	// not carry — it exists for arithmetic, not for presentation.
	// includeVoided brings back charges that have been voided. They are
	// excluded by default because they are not obligations; a caller asks for
	// them to review what was cancelled and why.
	// leaseID scopes the list to one contractual term — the UI's "This Lease"
	// view. Nil returns the whole tenancy, which is what balance and
	// allocation always operate on.
	ListInstances(
		ctx context.Context,
		financialAccountID string,
		leaseID *string,
		includeVoided bool,
	) ([]models.ChargeInstance, error)
}

type chargeService struct {
	repo     repository.ChargeRepository
	accounts repository.FinancialAccountRepository
}

func NewChargeService(
	repo repository.ChargeRepository,
	accounts repository.FinancialAccountRepository,
) ChargeService {
	return &chargeService{repo: repo, accounts: accounts}
}

// assertOpen refuses a write against a closed account.
//
// The status is read here rather than trusted from the caller: every write
// path reaches this service from somewhere different, and a guard that relied
// on each of them remembering to check would be a guard in name only.
func (s *chargeService) assertOpen(ctx context.Context, accountID string) error {
	account, err := s.accounts.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &accountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	return AssertAccountOpen(account.Status)
}

func (s *chargeService) ListInstances(
	ctx context.Context,
	financialAccountID string,
	leaseID *string,
	includeVoided bool,
) ([]models.ChargeInstance, error) {
	instances, err := s.repo.ListInstances(ctx, repository.ListChargeInstancesFilter{
		FinancialAccountID: &financialAccountID,
		LeaseID:            leaseID,
		IncludeVoided:      includeVoided,
	})
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ListInstances", "action": "listing charge instances"},
		})
	}
	return *instances, nil
}

func (s *chargeService) CloseDefinitionsForLease(
	ctx context.Context,
	financialAccountID, leaseID string,
) error {
	activeStatus := "ACTIVE"
	definitions, err := s.repo.ListDefinitions(ctx, repository.ListChargeDefinitionsFilter{
		FinancialAccountID: &financialAccountID,
		LeaseID:            &leaseID,
		Status:             &activeStatus,
	})
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CloseDefinitionsForLease", "action": "listing definitions"},
		})
	}

	for i := range *definitions {
		definition := (*definitions)[i]
		definition.Status = "CLOSED"
		if updateErr := s.repo.UpdateDefinition(ctx, &definition); updateErr != nil {
			return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
				Err:      updateErr,
				Metadata: map[string]string{"function": "CloseDefinitionsForLease", "action": "closing definition"},
			})
		}
	}

	return nil
}

func (s *chargeService) ScopeUnassignedToLease(ctx context.Context, financialAccountID, leaseID string) error {
	if err := s.repo.ScopeUnassignedToLease(ctx, financialAccountID, leaseID); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ScopeUnassignedToLease", "action": "scoping charges"},
		})
	}

	return nil
}

func (s *chargeService) ListViews(ctx context.Context, financialAccountID string) ([]ChargeView, error) {
	instances, err := s.repo.ListInstances(ctx, repository.ListChargeInstancesFilter{
		FinancialAccountID: &financialAccountID,
	})
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ListViews", "action": "listing charge instances"},
		})
	}

	views := make([]ChargeView, 0, len(*instances))
	for _, instance := range *instances {
		views = append(views, ToChargeView(instance))
	}
	return views, nil
}

// MaterialiseForAccount creates the definitions and the full set of instances
// for a newly prepared account: the whole rent term plus the security deposit.
//
// The initial deposit deliberately produces NO charge — it is a billing
// cadence (see DeriveRentBillingPolicy). A charge for it would double-count
// against the rent instances covering the same periods.
func (s *chargeService) MaterialiseForAccount(
	ctx context.Context,
	input MaterialiseForAccountInput,
) error {
	if err := s.assertOpen(ctx, input.FinancialAccountID); err != nil {
		return err
	}

	rentDefinition := &models.ChargeDefinition{
		FinancialAccountID: input.FinancialAccountID,
		LeaseID:            input.LeaseID,
		Name:               "Rent",
		Category:           CategoryRent,
		Amount:             input.RentFee,
		Currency:           input.Currency,
		Frequency:          input.PaymentFrequency,
		StartDate:          &input.MoveInDate,
		Status:             "ACTIVE",
	}
	if err := s.repo.CreateDefinition(ctx, rentDefinition); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "MaterialiseForAccount",
				"action":   "creating rent definition",
			},
		})
	}

	drafts, materialiseErr := MaterialiseRentInstances(MaterialiseRentInput{
		RentFee:               input.RentFee,
		Currency:              input.Currency,
		PaymentFrequency:      input.PaymentFrequency,
		MoveInDate:            input.MoveInDate,
		StayDuration:          input.StayDuration,
		StayDurationFrequency: input.StayDurationFrequency,
	})
	if materialiseErr != nil {
		return pkg.BadRequestError("LeaseTermTooLong", &pkg.RentLoopErrorParams{Err: materialiseErr})
	}

	definitionID := rentDefinition.ID.String()
	instances := make([]models.ChargeInstance, 0, len(drafts)+1)
	for _, draft := range drafts {
		periodStart := draft.PeriodStart
		periodEnd := draft.PeriodEnd
		instances = append(instances, models.ChargeInstance{
			FinancialAccountID: input.FinancialAccountID,
			LeaseID:            input.LeaseID,
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

	if input.SecurityDepositFee > 0 {
		depositDefinition := &models.ChargeDefinition{
			FinancialAccountID: input.FinancialAccountID,
			LeaseID:            input.LeaseID,
			Name:               "Security Deposit",
			Category:           CategorySecurityDeposit,
			Amount:             input.SecurityDepositFee,
			Currency:           input.Currency,
			Frequency:          "ONCE",
			Status:             "ACTIVE",
		}
		if err := s.repo.CreateDefinition(ctx, depositDefinition); err != nil {
			return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "MaterialiseForAccount",
					"action":   "creating deposit definition",
				},
			})
		}

		depositDefinitionID := depositDefinition.ID.String()
		instances = append(instances, models.ChargeInstance{
			FinancialAccountID: input.FinancialAccountID,
			LeaseID:            input.LeaseID,
			ChargeDefinitionID: &depositDefinitionID,
			Name:               "Security Deposit",
			Category:           CategorySecurityDeposit,
			Amount:             input.SecurityDepositFee,
			Currency:           input.Currency,
			DueDate:            input.SecurityDepositDue,
		})
	}

	if err := s.repo.CreateInstances(ctx, instances); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "MaterialiseForAccount",
				"action":   "creating instances",
			},
		})
	}

	return nil
}

// CreateAdHoc adds a one-off charge with no definition behind it — a damage
// charge, a utility bill, or a refund (negative amount).
//
// A refund that names the charge it reverses is capped at that charge's
// SettledAmount: you cannot refund money that was never received.
func (s *chargeService) CreateAdHoc(
	ctx context.Context,
	input CreateAdHocChargeInput,
) (*models.ChargeInstance, error) {
	if err := s.assertOpen(ctx, input.FinancialAccountID); err != nil {
		return nil, err
	}

	if input.Amount == 0 {
		return nil, pkg.BadRequestError("ChargeAmountCannotBeZero", nil)
	}

	if input.ReversesChargeInstanceID != nil {
		original, err := s.repo.GetInstance(ctx, *input.ReversesChargeInstanceID)
		if err != nil {
			return nil, pkg.NotFoundError("ReversedChargeNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		if input.Amount >= 0 {
			return nil, pkg.BadRequestError("ReversalMustBeNegative", nil)
		}
		if -input.Amount > original.SettledAmount {
			return nil, pkg.BadRequestError("ReversalExceedsSettledAmount", nil)
		}
		// Inherit the category so journal routing reverses the original's
		// accounts rather than falling back to Tenant Concessions.
		input.Category = original.Category
	}

	instance := &models.ChargeInstance{
		FinancialAccountID:       input.FinancialAccountID,
		LeaseID:                  input.LeaseID,
		Name:                     input.Name,
		Category:                 input.Category,
		Amount:                   input.Amount,
		Currency:                 input.Currency,
		DueDate:                  input.DueDate,
		ReversesChargeInstanceID: input.ReversesChargeInstanceID,
	}

	// Pass a one-element slice built from the pointer, not a dereferenced
	// copy: GORM writes the generated UUID into the slice element, so copying
	// here would return an instance with a zero ID.
	created := []models.ChargeInstance{*instance}
	if err := s.repo.CreateInstances(ctx, created); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CreateAdHoc", "action": "creating instance"},
		})
	}

	return &created[0], nil
}

// VoidInstance removes a charge from the ledger. A charge that has been billed
// or paid cannot be voided — void the invoice first, which releases the claim.
func (s *chargeService) VoidInstance(ctx context.Context, input VoidChargeInput) error {
	instance, err := s.repo.GetInstance(ctx, input.ChargeInstanceID)
	if err != nil {
		return pkg.NotFoundError("ChargeInstanceNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	if instance.VoidedAt != nil {
		return pkg.BadRequestError("ChargeAlreadyVoided", nil)
	}
	if instance.InvoicedAmount != 0 || instance.SettledAmount != 0 {
		return pkg.BadRequestError("ChargeAlreadyBilled", nil)
	}

	now := time.Now()
	instance.VoidedAt = &now
	instance.VoidedReason = &input.Reason

	if updateErr := s.repo.UpdateInstance(ctx, instance); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "VoidInstance", "action": "voiding instance"},
		})
	}

	return nil
}

// RederiveRent regenerates the rent schedule after a terms change. It is
// permitted only while every rent instance is clean; once anything has been
// invoiced or settled the landlord must adjust with explicit charges instead.
func (s *chargeService) RederiveRent(ctx context.Context, input RederiveRentInput) error {
	rentCategory := CategoryRent
	existing, err := s.repo.ListInstances(ctx, repository.ListChargeInstancesFilter{
		FinancialAccountID: &input.FinancialAccountID,
		Category:           &rentCategory,
	})
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "RederiveRent", "action": "listing rent instances"},
		})
	}

	views := make([]ChargeView, 0, len(*existing))
	for _, instance := range *existing {
		views = append(views, ToChargeView(instance))
	}

	if HasDirtyInstances(views) {
		return pkg.BadRequestError("ChargesAlreadyBilled", nil)
	}

	now := time.Now()
	reason := "Rent terms changed"
	for i := range *existing {
		instance := (*existing)[i]
		instance.VoidedAt = &now
		instance.VoidedReason = &reason
		if updateErr := s.repo.UpdateInstance(ctx, &instance); updateErr != nil {
			return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
				Err:      updateErr,
				Metadata: map[string]string{"function": "RederiveRent", "action": "voiding stale instance"},
			})
		}
	}

	// Close the superseded rent definitions. MaterialiseForAccount always
	// creates a fresh one, so without this every terms edit would leave
	// another ACTIVE rent template behind and the account would end up with
	// several conflicting answers to "what is the rent?".
	activeStatus := "ACTIVE"
	definitions, defErr := s.repo.ListDefinitions(ctx, repository.ListChargeDefinitionsFilter{
		FinancialAccountID: &input.FinancialAccountID,
		Status:             &activeStatus,
	})
	if defErr != nil {
		return pkg.InternalServerError(defErr.Error(), &pkg.RentLoopErrorParams{
			Err:      defErr,
			Metadata: map[string]string{"function": "RederiveRent", "action": "listing definitions"},
		})
	}
	for i := range *definitions {
		definition := (*definitions)[i]
		if definition.Category != CategoryRent {
			continue
		}
		definition.Status = "CLOSED"
		definition.EndDate = &now
		if updateErr := s.repo.UpdateDefinition(ctx, &definition); updateErr != nil {
			return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
				Err:      updateErr,
				Metadata: map[string]string{"function": "RederiveRent", "action": "closing stale definition"},
			})
		}
	}

	return s.MaterialiseForAccount(ctx, MaterialiseForAccountInput{
		FinancialAccountID:    input.FinancialAccountID,
		RentFee:               input.RentFee,
		Currency:              input.Currency,
		PaymentFrequency:      input.PaymentFrequency,
		MoveInDate:            input.MoveInDate,
		StayDuration:          input.StayDuration,
		StayDurationFrequency: input.StayDurationFrequency,
		SecurityDepositFee:    0, // deposit is untouched by a rent terms change
	})
}
