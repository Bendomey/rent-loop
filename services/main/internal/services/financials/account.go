package financials

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type PrepareChargesInput struct {
	TenantApplicationID   string
	ClientID              *string
	PropertyID            *string
	Currency              string
	RentFee               int64
	PaymentFrequency      string
	MoveInDate            time.Time
	StayDuration          int64
	StayDurationFrequency string
	InitialDepositFee     int64
	SecurityDepositFee    int64
	SecurityDepositDue    time.Time
	AutoIssueDaysBefore   int64
}

// OpenForLeaseInput opens an account for a lease that already exists, rather
// than for an application. Used only when a renewal moves units and the PM has
// said the money should not follow.
type OpenForLeaseInput struct {
	// Provenance, inherited from the parent's account. The renewal has no
	// application of its own.
	OriginTenantApplicationID string
	TenantID                  string
	Currency                  string
	ClientID                  *string
	PropertyID                *string
}

type UpdateBillingPolicyInput struct {
	FinancialAccountID  string
	Cadence             *string
	Interval            *int64
	AutoIssueDaysBefore *int64
}

// AccountSummary is the read model behind both the landlord's Financials tab
// and the tenant's read-only view.
type AccountSummary struct {
	Account           *models.FinancialAccount
	Charges           []ChargeView
	TotalCharged      int64
	TotalSettled      int64
	OutstandingAmount int64
	AvailableCredit   int64
}

type FinancialAccountService interface {
	PrepareCharges(ctx context.Context, input PrepareChargesInput) (*models.FinancialAccount, error)
	GetByApplication(ctx context.Context, applicationID string) (*models.FinancialAccount, error)
	// Revive returns a CLOSURE_ELIGIBLE account to ACTIVE. Called when a
	// renewal lands on an account that looked finished.
	Revive(ctx context.Context, accountID string) error
	// OpenForLease creates an account for an existing lease. Unlike
	// PrepareCharges it creates no charges: the caller materialises the term
	// itself, because it already knows the lease the charges belong to.
	OpenForLease(ctx context.Context, input OpenForLeaseInput) (*models.FinancialAccount, error)
	GetByID(ctx context.Context, accountID string) (*models.FinancialAccount, error)
	LinkLease(ctx context.Context, accountID, tenantID string) error
	Relocate(ctx context.Context, accountID, propertyID string) error
	UpdateBillingPolicy(ctx context.Context, input UpdateBillingPolicyInput) error
	Summary(ctx context.Context, accountID string) (*AccountSummary, error)
}

type financialAccountService struct {
	repo       repository.FinancialAccountRepository
	charges    ChargeService
	allocation AllocationService
}

func NewFinancialAccountService(
	repo repository.FinancialAccountRepository,
	charges ChargeService,
	allocation AllocationService,
) FinancialAccountService {
	return &financialAccountService{repo: repo, charges: charges, allocation: allocation}
}

// PrepareCharges turns agreed application terms into a ledger.
//
// InitialDepositFee produces NO charge — it becomes the rent billing cadence.
// A charge for it would double-count against the rent instances covering the
// same periods.
func (s *financialAccountService) PrepareCharges(
	ctx context.Context,
	input PrepareChargesInput,
) (*models.FinancialAccount, error) {
	policy := DeriveRentBillingPolicy(input.InitialDepositFee, input.RentFee)

	autoIssue := input.AutoIssueDaysBefore
	if autoIssue <= 0 {
		autoIssue = 5
	}

	account := &models.FinancialAccount{
		OriginTenantApplicationID: input.TenantApplicationID,
		ClientID:                  input.ClientID,
		PropertyID:                input.PropertyID,
		Currency:                  input.Currency,
		RentBillingCadence:        policy.Cadence,
		RentBillingInterval:       policy.Interval,
		AutoIssueDaysBefore:       autoIssue,
		Status:                    "ACTIVE",
	}

	if err := s.repo.Create(ctx, account); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "PrepareCharges", "action": "creating account"},
		})
	}

	materialiseErr := s.charges.MaterialiseForAccount(ctx, MaterialiseForAccountInput{
		FinancialAccountID:    account.ID.String(),
		RentFee:               input.RentFee,
		Currency:              input.Currency,
		PaymentFrequency:      input.PaymentFrequency,
		MoveInDate:            input.MoveInDate,
		StayDuration:          input.StayDuration,
		StayDurationFrequency: input.StayDurationFrequency,
		SecurityDepositFee:    input.SecurityDepositFee,
		SecurityDepositDue:    input.SecurityDepositDue,
	})
	if materialiseErr != nil {
		return nil, materialiseErr
	}

	return account, nil
}

func (s *financialAccountService) GetByApplication(
	ctx context.Context,
	applicationID string,
) (*models.FinancialAccount, error) {
	return s.repo.GetOne(ctx, repository.GetFinancialAccountQuery{TenantApplicationID: &applicationID})
}

func (s *financialAccountService) OpenForLease(
	ctx context.Context,
	input OpenForLeaseInput,
) (*models.FinancialAccount, error) {
	account := &models.FinancialAccount{
		OriginTenantApplicationID: input.OriginTenantApplicationID,
		TenantID:                  &input.TenantID,
		ClientID:                  input.ClientID,
		PropertyID:                input.PropertyID,
		Currency:                  input.Currency,
		// No prepayment is known at this point, so there is nothing to derive
		// a cadence from. MANUAL means the sweep leaves it alone until a PM
		// sets a policy, which is safer than inventing one.
		RentBillingCadence:  CadenceManual,
		RentBillingInterval: 1,
		AutoIssueDaysBefore: 5,
		Status:              StatusActive,
	}

	if err := s.repo.Create(ctx, account); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "OpenForLease", "action": "creating account"},
		})
	}

	return account, nil
}

// Revive undoes eligibility. It does not touch ClosedAt, because an account
// that reached CLOSED is not reusable and never arrives here.
func (s *financialAccountService) Revive(ctx context.Context, accountID string) error {
	account, err := s.repo.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &accountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	if account.Status != StatusClosureEligible {
		return nil
	}

	account.Status = StatusActive
	account.ClosureEligibleAt = nil

	if updateErr := s.repo.Update(ctx, account); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Revive", "action": "reviving account"},
		})
	}

	return nil
}

func (s *financialAccountService) GetByID(
	ctx context.Context,
	accountID string,
) (*models.FinancialAccount, error) {
	return s.repo.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &accountID})
}

// LinkLease completes the application -> lease transition. It stamps the
// tenant onto the account, which is what turns an application-stage account
// (TenantID IS NULL) into a live tenancy. No charge, invoice, payment or
// allocation moves, which is why paying before and after approval are the same
// operation.
//
// The other half of the link — leases.financial_account_id — is written by the
// caller on the lease row, because many leases now point at one account.
func (s *financialAccountService) LinkLease(ctx context.Context, accountID, tenantID string) error {
	account, err := s.repo.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &accountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	account.TenantID = &tenantID

	if updateErr := s.repo.Update(ctx, account); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "LinkLease", "action": "linking tenant"},
		})
	}

	return nil
}

// Relocate moves an account's denormalised property.
//
// That column is not decoration. The Cube resolves an invoice's property
// through `financial_accounts.property_id`, and the Insights security scope
// uses the same derivation — so an account left pointing at its old property
// after its application moves reports that tenant's invoices under the wrong
// property, and hides them from anyone scoped to the new one. Nothing errors;
// the money simply appears in the wrong place.
//
// ClientID is deliberately untouched: a caller can only address properties
// within their own client, so the owning client never changes here.
func (s *financialAccountService) Relocate(
	ctx context.Context,
	accountID, propertyID string,
) error {
	account, err := s.repo.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &accountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	account.PropertyID = &propertyID

	if updateErr := s.repo.Update(ctx, account); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Relocate", "action": "moving account"},
		})
	}

	return nil
}

func (s *financialAccountService) UpdateBillingPolicy(
	ctx context.Context,
	input UpdateBillingPolicyInput,
) error {
	account, err := s.repo.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &input.FinancialAccountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	if input.Cadence != nil {
		switch *input.Cadence {
		case CadenceEveryPeriod, CadenceEveryNPeriods, CadenceUpfront, CadenceManual:
			account.RentBillingCadence = *input.Cadence
		default:
			return pkg.BadRequestError("InvalidRentBillingCadence", nil)
		}
	}
	if input.Interval != nil {
		if *input.Interval < 1 {
			return pkg.BadRequestError("RentBillingIntervalMustBePositive", nil)
		}
		account.RentBillingInterval = *input.Interval
	}
	if input.AutoIssueDaysBefore != nil {
		if *input.AutoIssueDaysBefore < 0 {
			return pkg.BadRequestError("AutoIssueDaysBeforeCannotBeNegative", nil)
		}
		account.AutoIssueDaysBefore = *input.AutoIssueDaysBefore
	}

	if updateErr := s.repo.Update(ctx, account); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "UpdateBillingPolicy", "action": "updating policy"},
		})
	}

	return nil
}

func (s *financialAccountService) Summary(
	ctx context.Context,
	accountID string,
) (*AccountSummary, error) {
	account, err := s.repo.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &accountID})
	if err != nil {
		return nil, pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	views, viewErr := s.charges.ListViews(ctx, accountID)
	if viewErr != nil {
		return nil, viewErr
	}

	credit, creditErr := s.allocation.AvailableCredit(ctx, accountID)
	if creditErr != nil {
		return nil, creditErr
	}

	var charged, settled int64
	for _, v := range views {
		charged += v.Amount
		settled += v.SettledAmount
	}

	return &AccountSummary{
		Account:           account,
		Charges:           views,
		TotalCharged:      charged,
		TotalSettled:      settled,
		OutstandingAmount: AccountBalance(views),
		AvailableCredit:   credit,
	}, nil
}

// Financials is the single dependency other services take on this package.
// InvoiceService, PaymentService, LeaseService and TenantApplicationService
// all go through this facade and never touch charge tables directly.
type Financials struct {
	Accounts   FinancialAccountService
	Charges    ChargeService
	Allocation AllocationService
	// Issuance is attached after InvoiceService exists — see SetIssuance.
	Issuance IssuanceService
	// Closure is attached after LeaseService exists — see SetClosure.
	Closure ClosureService
}

func New(
	accountRepo repository.FinancialAccountRepository,
	chargeRepo repository.ChargeRepository,
	allocationRepo repository.PaymentAllocationRepository,
) *Financials {
	charges := NewChargeService(chargeRepo)
	allocation := NewAllocationService(chargeRepo, allocationRepo, accountRepo)
	accounts := NewFinancialAccountService(accountRepo, charges, allocation)

	return &Financials{Accounts: accounts, Charges: charges, Allocation: allocation}
}

// SetIssuance completes the facade once InvoiceService is available. The
// two-step construction exists because issuance composes invoices while
// InvoiceService allocates charges, so neither can be built first.
func (f *Financials) SetIssuance(svc IssuanceService) {
	f.Issuance = svc
}

// SetClosure completes the facade once the lease service exists. Closure needs
// to read lease terms, and the lease service already depends on this package,
// so the dependency is injected after construction exactly as issuance is.
func (f *Financials) SetClosure(svc ClosureService) {
	f.Closure = svc
}
