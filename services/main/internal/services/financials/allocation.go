package financials

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

// ComposedLine is an invoice line the engine has validated and reserved. The
// caller persists it as an InvoiceLineItem.
type ComposedLine struct {
	ChargeInstanceID string
	Label            string
	Category         string
	Amount           int64
	Currency         string
}

// ReleaseLine undoes a reservation when an invoice or line is voided.
type ReleaseLine struct {
	ChargeInstanceID string
	Amount           int64
}

type ComposeInput struct {
	FinancialAccountID string
	AccountCurrency    string
	Claims             []Claim
}

type AllocatePaymentInput struct {
	PaymentID string
	// Lines are the parent invoice's lines, in any order. The engine sorts by
	// the charge's due date when Allocations is nil.
	Lines []ComposedLine
	// Amount actually received. May exceed the invoice total; the residue is
	// left unallocated and becomes account credit.
	Amount   int64
	Currency string
	// Allocations, when supplied, is the landlord's explicit split and is used
	// verbatim. When nil the engine fills oldest-due-date first.
	Allocations []Claim
}

type AllocationService interface {
	ComposeByClaims(ctx context.Context, input ComposeInput) ([]ComposedLine, error)
	ComposeByAmount(ctx context.Context, financialAccountID string, amount int64) ([]Claim, error)
	AllocatePayment(ctx context.Context, input AllocatePaymentInput) error
	ReleaseClaims(ctx context.Context, lines []ReleaseLine) error
	AvailableCredit(ctx context.Context, financialAccountID string) (int64, error)
}

type allocationService struct {
	chargeRepo     repository.ChargeRepository
	allocationRepo repository.PaymentAllocationRepository
	accountRepo    repository.FinancialAccountRepository
}

func NewAllocationService(
	chargeRepo repository.ChargeRepository,
	allocationRepo repository.PaymentAllocationRepository,
	accountRepo repository.FinancialAccountRepository,
) AllocationService {
	return &allocationService{
		chargeRepo:     chargeRepo,
		allocationRepo: allocationRepo,
		accountRepo:    accountRepo,
	}
}

// ComposeByAmount derives claims from a bare amount, oldest due date first.
// The caller shows these to the landlord for review before issuing — the
// amount box is a shortcut, not a constraint.
func (s *allocationService) ComposeByAmount(
	ctx context.Context,
	financialAccountID string,
	amount int64,
) ([]Claim, error) {
	instances, err := s.chargeRepo.ListInstances(ctx, repository.ListChargeInstancesFilter{
		FinancialAccountID: &financialAccountID,
	})
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ComposeByAmount", "action": "listing charges"},
		})
	}

	views := make([]ChargeView, 0, len(*instances))
	for _, instance := range *instances {
		views = append(views, ToChargeView(instance))
	}

	claims, remainder := FillOldestFirst(views, amount)
	if remainder != 0 {
		return nil, pkg.BadRequestError("AmountExceedsOutstandingCharges", nil)
	}

	return claims, nil
}

// ComposeByClaims validates and reserves each claim against its charge.
//
// MUST run inside a transaction: LockInstances takes SELECT ... FOR UPDATE, and
// without it two concurrent compositions both observe the same available
// amount and over-claim the same charge.
func (s *allocationService) ComposeByClaims(
	ctx context.Context,
	input ComposeInput,
) ([]ComposedLine, error) {
	if len(input.Claims) == 0 {
		return nil, pkg.BadRequestError("NoChargesSelected", nil)
	}

	ids := make([]string, 0, len(input.Claims))
	for _, claim := range input.Claims {
		ids = append(ids, claim.ChargeInstanceID)
	}

	locked, err := s.chargeRepo.LockInstances(ctx, ids)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ComposeByClaims", "action": "locking charges"},
		})
	}

	byID := make(map[string]*models.ChargeInstance, len(locked))
	for i := range locked {
		byID[locked[i].ID.String()] = &locked[i]
	}

	lines := make([]ComposedLine, 0, len(input.Claims))
	for _, claim := range input.Claims {
		instance, ok := byID[claim.ChargeInstanceID]
		if !ok {
			return nil, pkg.NotFoundError("ChargeInstanceNotFound", nil)
		}
		if instance.VoidedAt != nil {
			return nil, pkg.BadRequestError("ChargeInstanceVoided", nil)
		}
		if instance.Currency != input.AccountCurrency {
			return nil, pkg.BadRequestError("CurrencyMismatch", nil)
		}
		if claim.Amount == 0 {
			return nil, pkg.BadRequestError("ClaimAmountCannotBeZero", nil)
		}
		if (claim.Amount < 0) != (instance.Amount < 0) {
			return nil, pkg.BadRequestError("SignMismatch", nil)
		}

		available := instance.Amount - instance.InvoicedAmount
		if abs64(claim.Amount) > abs64(available) {
			return nil, pkg.BadRequestError("ClaimExceedsChargeBalance", nil)
		}

		instance.InvoicedAmount += claim.Amount
		if updateErr := s.chargeRepo.UpdateInstance(ctx, instance); updateErr != nil {
			return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
				Err:      updateErr,
				Metadata: map[string]string{"function": "ComposeByClaims", "action": "reserving claim"},
			})
		}

		lines = append(lines, ComposedLine{
			ChargeInstanceID: claim.ChargeInstanceID,
			Label:            instance.Name,
			Category:         instance.Category,
			Amount:           claim.Amount,
			Currency:         instance.Currency,
		})
	}

	return lines, nil
}

// ReleaseClaims returns reserved amounts to their charges when an invoice or
// line is voided. Without this a voided invoice permanently locks its charges
// as "already billed" and the queue skips them forever.
func (s *allocationService) ReleaseClaims(ctx context.Context, lines []ReleaseLine) error {
	if len(lines) == 0 {
		return nil
	}

	ids := make([]string, 0, len(lines))
	for _, line := range lines {
		ids = append(ids, line.ChargeInstanceID)
	}

	locked, err := s.chargeRepo.LockInstances(ctx, ids)
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ReleaseClaims", "action": "locking charges"},
		})
	}

	byID := make(map[string]*models.ChargeInstance, len(locked))
	for i := range locked {
		byID[locked[i].ID.String()] = &locked[i]
	}

	for _, line := range lines {
		instance, ok := byID[line.ChargeInstanceID]
		if !ok {
			continue
		}
		instance.InvoicedAmount -= line.Amount
		if updateErr := s.chargeRepo.UpdateInstance(ctx, instance); updateErr != nil {
			return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
				Err:      updateErr,
				Metadata: map[string]string{"function": "ReleaseClaims", "action": "releasing claim"},
			})
		}
	}

	return nil
}

// AllocatePayment records which obligations a payment satisfied.
//
// When input.Allocations is nil the engine fills oldest-due-date first across
// the invoice's lines. Any residue beyond the invoice total is deliberately
// NOT rejected — it stays unallocated on the payment and is consumed as credit
// at the next composition.
func (s *allocationService) AllocatePayment(ctx context.Context, input AllocatePaymentInput) error {
	if input.Amount == 0 {
		return nil
	}

	claims := input.Allocations
	if claims == nil {
		views, err := s.viewsForLines(ctx, input.Lines)
		if err != nil {
			return err
		}
		claims, _ = FillOldestFirst(views, input.Amount)
	}

	if len(claims) == 0 {
		return nil
	}

	ids := make([]string, 0, len(claims))
	for _, claim := range claims {
		ids = append(ids, claim.ChargeInstanceID)
	}

	locked, err := s.chargeRepo.LockInstances(ctx, ids)
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "AllocatePayment", "action": "locking charges"},
		})
	}

	byID := make(map[string]*models.ChargeInstance, len(locked))
	for i := range locked {
		byID[locked[i].ID.String()] = &locked[i]
	}

	allocations := make([]models.PaymentAllocation, 0, len(claims))
	for _, claim := range claims {
		instance, ok := byID[claim.ChargeInstanceID]
		if !ok {
			return pkg.NotFoundError("ChargeInstanceNotFound", nil)
		}

		unsettled := instance.Amount - instance.SettledAmount
		if abs64(claim.Amount) > abs64(unsettled) {
			return pkg.BadRequestError("AllocationExceedsChargeBalance", nil)
		}

		instance.SettledAmount += claim.Amount
		if updateErr := s.chargeRepo.UpdateInstance(ctx, instance); updateErr != nil {
			return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
				Err:      updateErr,
				Metadata: map[string]string{"function": "AllocatePayment", "action": "settling charge"},
			})
		}

		allocations = append(allocations, models.PaymentAllocation{
			PaymentID:        input.PaymentID,
			ChargeInstanceID: claim.ChargeInstanceID,
			Amount:           claim.Amount,
			Currency:         input.Currency,
		})
	}

	if createErr := s.allocationRepo.CreateMany(ctx, allocations); createErr != nil {
		return pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err:      createErr,
			Metadata: map[string]string{"function": "AllocatePayment", "action": "persisting allocations"},
		})
	}

	return nil
}

// AvailableCredit is the residue of payments that were never fully allocated.
//
// Both sides are summed independently rather than walking allocation rows: a
// fully unallocated overpayment has no allocation rows at all, and that
// residue is precisely the credit we are looking for.
func (s *allocationService) AvailableCredit(
	ctx context.Context,
	financialAccountID string,
) (int64, error) {
	paymentTotal, paymentErr := s.accountRepo.SumSuccessfulPayments(ctx, financialAccountID)
	if paymentErr != nil {
		return 0, pkg.InternalServerError(paymentErr.Error(), &pkg.RentLoopErrorParams{
			Err:      paymentErr,
			Metadata: map[string]string{"function": "AvailableCredit", "action": "summing payments"},
		})
	}

	allocatedTotal, allocErr := s.allocationRepo.SumByAccount(ctx, financialAccountID)
	if allocErr != nil {
		return 0, pkg.InternalServerError(allocErr.Error(), &pkg.RentLoopErrorParams{
			Err:      allocErr,
			Metadata: map[string]string{"function": "AvailableCredit", "action": "summing allocations"},
		})
	}

	return AvailableCreditFrom(paymentTotal, allocatedTotal), nil
}

// viewsForLines projects an invoice's lines onto ChargeViews for allocation.
//
// Allocation consumes UNSETTLED amount, so SettledAmount is projected into the
// InvoicedAmount slot the fill algorithm reads — the same arithmetic then
// serves both reservation and settlement.
func (s *allocationService) viewsForLines(
	ctx context.Context,
	lines []ComposedLine,
) ([]ChargeView, error) {
	ids := make([]string, 0, len(lines))
	for _, line := range lines {
		ids = append(ids, line.ChargeInstanceID)
	}

	locked, err := s.chargeRepo.LockInstances(ctx, ids)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "viewsForLines", "action": "locking charges"},
		})
	}

	views := make([]ChargeView, 0, len(locked))
	for _, instance := range locked {
		view := ToChargeView(instance)
		view.InvoicedAmount = instance.SettledAmount
		views = append(views, view)
	}

	return views, nil
}
