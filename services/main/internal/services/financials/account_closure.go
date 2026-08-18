package financials

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

// DepositResolution is what the PM decided happens to money still held.
type DepositResolution string

const (
	// DepositRelease refunds the full held amount to the tenant.
	DepositRelease DepositResolution = "RELEASE"
	// DepositOffset applies the deposit against what the tenant still owes.
	DepositOffset DepositResolution = "OFFSET"
	// DepositForfeit keeps the deposit. Requires a reason.
	DepositForfeit DepositResolution = "FORFEIT"
)

// ClosureEligibility is the read model behind the PM's closure panel.
type ClosureEligibility struct {
	Gates             []ClosureGate `json:"gates"`
	CanClose          bool          `json:"can_close"`
	DepositHeldAmount int64         `json:"deposit_held_amount"`
	OutstandingAmount int64         `json:"outstanding_amount"`
}

type CloseAccountInput struct {
	FinancialAccountID string
	ClosedByID         string
	Reason             string
	DepositResolution  DepositResolution
	// Set when the deposit is forfeited; recorded on the closure row.
	DepositForfeitReason *string
}

type ReopenAccountInput struct {
	FinancialAccountID string
	ReopenedByID       string
	Reason             string
}

// LeaseTermReader hands the closure service the account's lease terms without
// this package importing the lease service, which would be a cycle.
type LeaseTermReader interface {
	ListTermsForAccount(ctx context.Context, financialAccountID string) ([]LeaseTerm, error)
	HasMoveOutEvidence(ctx context.Context, financialAccountID string) (bool, error)
}

type ClosureService interface {
	Eligibility(ctx context.Context, accountID string) (*ClosureEligibility, error)
	RecomputeEligibility(ctx context.Context, accountID string) error
	Close(ctx context.Context, input CloseAccountInput) error
	Reopen(ctx context.Context, input ReopenAccountInput) error
}

type closureService struct {
	accounts  repository.FinancialAccountRepository
	closures  repository.FinancialAccountClosureRepository
	charges   ChargeService
	leaseInfo LeaseTermReader
}

func NewClosureService(
	accounts repository.FinancialAccountRepository,
	closures repository.FinancialAccountClosureRepository,
	charges ChargeService,
	leaseInfo LeaseTermReader,
) ClosureService {
	return &closureService{accounts: accounts, closures: closures, charges: charges, leaseInfo: leaseInfo}
}

func (s *closureService) gateInput(
	ctx context.Context,
	accountID string,
) (ClosureGateInput, []ChargeView, error) {
	views, viewErr := s.charges.ListViews(ctx, accountID)
	if viewErr != nil {
		return ClosureGateInput{}, nil, viewErr
	}

	terms, termErr := s.leaseInfo.ListTermsForAccount(ctx, accountID)
	if termErr != nil {
		return ClosureGateInput{}, nil, termErr
	}

	moveOut, moveOutErr := s.leaseInfo.HasMoveOutEvidence(ctx, accountID)
	if moveOutErr != nil {
		return ClosureGateInput{}, nil, moveOutErr
	}

	return ClosureGateInput{
		Terms:              terms,
		OutstandingAmount:  AccountBalance(views),
		DepositHeldAmount:  DepositHeld(views),
		HasMoveOutEvidence: moveOut,
	}, views, nil
}

func (s *closureService) Eligibility(ctx context.Context, accountID string) (*ClosureEligibility, error) {
	in, _, err := s.gateInput(ctx, accountID)
	if err != nil {
		return nil, err
	}

	// The panel shows the gates as they stand before the PM chooses what
	// happens to the deposit, so DepositResolved is false here by definition.
	gates := EvaluateClosureGates(in)

	return &ClosureEligibility{
		Gates:             gates,
		CanClose:          CanClose(gates),
		DepositHeldAmount: in.DepositHeldAmount,
		OutstandingAmount: in.OutstandingAmount,
	}, nil
}

// RecomputeEligibility moves an account between ACTIVE and CLOSURE_ELIGIBLE.
// It NEVER closes an account and never touches a CLOSED one: closing releases
// a deposit, and that decision belongs to a person.
func (s *closureService) RecomputeEligibility(ctx context.Context, accountID string) error {
	account, err := s.accounts.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &accountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	if account.Status == StatusClosed {
		return nil
	}

	terms, termErr := s.leaseInfo.ListTermsForAccount(ctx, accountID)
	if termErr != nil {
		return termErr
	}

	eligible := IsClosureEligible(terms)

	switch {
	case eligible && account.Status != StatusClosureEligible:
		now := time.Now()
		account.Status = StatusClosureEligible
		account.ClosureEligibleAt = &now
	case !eligible && account.Status == StatusClosureEligible:
		account.Status = StatusActive
		account.ClosureEligibleAt = nil
	default:
		return nil
	}

	if updateErr := s.accounts.Update(ctx, account); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "RecomputeEligibility", "action": "updating status"},
		})
	}

	return nil
}

func (s *closureService) Close(ctx context.Context, input CloseAccountInput) error {
	account, err := s.accounts.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &input.FinancialAccountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	if account.Status == StatusClosed {
		return pkg.BadRequestError("FinancialAccountAlreadyClosed", nil)
	}

	if input.Reason == "" {
		return pkg.BadRequestError("ClosureReasonRequired", nil)
	}

	gateInput, views, gateErr := s.gateInput(ctx, input.FinancialAccountID)
	if gateErr != nil {
		return gateErr
	}

	// The PM has now told us what happens to the deposit, which is what the
	// eligibility read model could not know.
	gateInput.DepositResolved = true

	if input.DepositResolution == DepositForfeit && input.DepositForfeitReason == nil {
		return pkg.BadRequestError("DepositForfeitReasonRequired", nil)
	}

	gates := EvaluateClosureGates(gateInput)
	if !CanClose(gates) {
		return pkg.BadRequestError("FinancialAccountNotClosable", nil)
	}

	closure := &models.FinancialAccountClosure{
		FinancialAccountID:   input.FinancialAccountID,
		Reason:               input.Reason,
		ClosedAt:             time.Now(),
		ClosedByID:           input.ClosedByID,
		OutstandingAtClosure: gateInput.OutstandingAmount,
		DepositHeldAmount:    gateInput.DepositHeldAmount,
	}

	if gateInput.DepositHeldAmount > 0 {
		switch input.DepositResolution {
		case DepositForfeit:
			closure.DepositForfeitedAmount = gateInput.DepositHeldAmount
		case DepositRelease, DepositOffset:
			refundID, refundErr := s.refundDeposit(
				ctx, input.FinancialAccountID, account.Currency, views, gateInput.DepositHeldAmount,
			)
			if refundErr != nil {
				return refundErr
			}
			closure.DepositRefundChargeInstanceID = refundID
		default:
			return pkg.BadRequestError("InvalidDepositResolution", nil)
		}
	}

	if createErr := s.closures.Create(ctx, closure); createErr != nil {
		return pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err:      createErr,
			Metadata: map[string]string{"function": "Close", "action": "recording closure"},
		})
	}

	now := time.Now()
	account.Status = StatusClosed
	account.ClosedAt = &now

	if updateErr := s.accounts.Update(ctx, account); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Close", "action": "closing account"},
		})
	}

	return nil
}

// refundDeposit posts the reversing SECURITY_DEPOSIT instance. There is no
// refund-specific category by design: sign carries direction, so a negative
// deposit charge IS the refund and routes through the same journal case.
func (s *closureService) refundDeposit(
	ctx context.Context,
	accountID, currency string,
	views []ChargeView,
	amount int64,
) (*string, error) {
	var originalID string
	for _, view := range views {
		if view.Category == CategorySecurityDeposit && view.Amount > 0 {
			originalID = view.ID
			break
		}
	}

	if originalID == "" {
		return nil, pkg.BadRequestError("NoSecurityDepositToRefund", nil)
	}

	instance, err := s.charges.CreateAdHoc(ctx, CreateAdHocChargeInput{
		FinancialAccountID:       accountID,
		Name:                     "Security deposit release",
		Category:                 CategorySecurityDeposit,
		Amount:                   -amount,
		Currency:                 currency,
		DueDate:                  time.Now(),
		ReversesChargeInstanceID: &originalID,
	})
	if err != nil {
		return nil, err
	}

	id := instance.ID.String()

	return &id, nil
}

func (s *closureService) Reopen(ctx context.Context, input ReopenAccountInput) error {
	account, err := s.accounts.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &input.FinancialAccountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	if account.Status != StatusClosed {
		return pkg.BadRequestError("FinancialAccountNotClosed", nil)
	}

	if input.Reason == "" {
		return pkg.BadRequestError("ReopenReasonRequired", nil)
	}

	closure, closureErr := s.closures.GetByAccount(ctx, input.FinancialAccountID)
	if closureErr != nil {
		return pkg.NotFoundError("FinancialAccountClosureNotFound", &pkg.RentLoopErrorParams{Err: closureErr})
	}

	now := time.Now()
	closure.ReopenedAt = &now
	closure.ReopenedByID = &input.ReopenedByID
	closure.ReopenReason = &input.Reason

	if updateErr := s.closures.Update(ctx, closure); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Reopen", "action": "recording reopen"},
		})
	}

	account.Status = StatusActive
	account.ClosedAt = nil
	account.ClosureEligibleAt = nil

	if accountErr := s.accounts.Update(ctx, account); accountErr != nil {
		return pkg.InternalServerError(accountErr.Error(), &pkg.RentLoopErrorParams{
			Err:      accountErr,
			Metadata: map[string]string{"function": "Reopen", "action": "reopening account"},
		})
	}

	return nil
}
