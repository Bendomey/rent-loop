package services

import (
	"context"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services/financials"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

// RenewLeaseInput is what a PM supplies to continue a tenancy. Everything not
// named here is inherited from the parent: tenant, currency, payment
// frequency, and the originating application.
type RenewLeaseInput struct {
	LeaseID               string
	MoveInDate            time.Time
	StayDuration          int64
	StayDurationFrequency string

	// Optional. Defaults to the parent's.
	RentFee *int64
	UnitID  *string

	// Only meaningful when UnitID differs from the parent's. Nil or true
	// carries the parent's financial account; false opens a new one.
	CarryFinancialAccount *bool

	// The property manager performing the renewal. Recorded on the closure row
	// when the renewal reopens a closed account, so a reopen is never
	// anonymous.
	ClientUserID string

	// Fees are one-off amounts the tenant pays at the start of the new term —
	// a deposit top-up when rent has risen, a renewal fee, a utility. They are
	// created here rather than through the ad-hoc charge endpoint so a renewal
	// and its money are one atomic act: a term never exists with half its
	// charges on it.
	//
	// This is also why a renewal still creates no deposit charge on its own.
	// A top-up is only ever raised because a person asked for it.
	Fees []RenewalFee

	LeaseAgreementDocumentUrl *string
}

// RenewalFeeCategoryAllowed reports whether a one-off may carry this category.
//
// RENT is refused deliberately: rent comes from the term itself and is
// materialised as a schedule, so a one-off calling itself rent would be billed
// twice over and belong to no period. An empty category is refused too — it
// would route to the wrong journal account.
func RenewalFeeCategoryAllowed(category string) bool {
	switch category {
	case financials.CategorySecurityDeposit, financials.CategoryAgencyFee, financials.CategoryVAT,
		financials.CategoryUtility, financials.CategoryDamageCharge,
		financials.CategoryEarlyTerminationFee, financials.CategoryOther:
		return true
	default:
		return false
	}
}

// RenewalFee is a one-off charge raised against the new term.
type RenewalFee struct {
	Category string
	Name     string
	Amount   int64
}

// CanRenewParent reports whether a lease is in a state that can be continued.
//
// Active is the normal case — a renewal is signed before the tenant's term
// lapses, not after. Completed is allowed so a lapsed tenancy can still be
// picked up. The rest cannot: Pending has nothing to renew yet, Cancelled
// never ran, and Terminated ended early, which makes any return a new tenancy
// rather than a continuation of this one.
func CanRenewParent(status string) bool {
	switch status {
	case "Lease.Status.Active", "Lease.Status.Completed":
		return true
	default:
		return false
	}
}

// HasBlockingRenewal reports whether a parent already has a renewal that
// counts.
//
// A Cancelled child deliberately does not block: the PM cancelled it precisely
// so they could create a corrected one.
func HasBlockingRenewal(children []models.Lease) bool {
	for _, child := range children {
		if child.Status != "Lease.Status.Cancelled" {
			return true
		}
	}

	return false
}

// OverlapsParentTerm reports whether a renewal would start before its parent
// finishes.
//
// Starting exactly at the parent's move-out is the normal continuous renewal
// and is allowed. A gap is allowed too — a tenant may be away before
// returning. Only a genuine overlap is refused, because on one unit that means
// the tenant holds it twice.
func OverlapsParentTerm(moveIn time.Time, parentMoveOut *time.Time) bool {
	if parentMoveOut == nil {
		return false
	}

	return moveIn.Before(*parentMoveOut)
}

// UnitHasCapacity reports whether a unit can take one more tenancy.
//
// A count rather than a boolean because rooms may hold several tenants: two of
// four occupied still has space.
func UnitHasCapacity(occupying, maxOccupants int64) bool {
	return occupying < maxOccupants
}

func (s *leaseService) RenewLease(ctx context.Context, input RenewLeaseInput) (*models.Lease, error) {
	parent, err := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{
		ID:       input.LeaseID,
		Populate: &[]string{"Unit"},
	})
	if err != nil {
		return nil, pkg.NotFoundError("LeaseNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	if !CanRenewParent(parent.Status) {
		return nil, pkg.BadRequestError("ParentLeaseNotRenewable", nil)
	}

	children, childErr := s.repo.ListChildren(ctx, input.LeaseID)
	if childErr != nil {
		return nil, pkg.InternalServerError(childErr.Error(), &pkg.RentLoopErrorParams{
			Err:      childErr,
			Metadata: map[string]string{"function": "RenewLease", "action": "listing children"},
		})
	}
	if HasBlockingRenewal(*children) {
		return nil, pkg.BadRequestError("LeaseAlreadyRenewed", nil)
	}

	if OverlapsParentTerm(input.MoveInDate, parent.MoveOutDate) {
		return nil, pkg.BadRequestError("RenewalOverlapsParentTerm", nil)
	}

	unitID := parent.UnitId
	if input.UnitID != nil {
		unitID = *input.UnitID
	}
	unitChanged := unitID != parent.UnitId

	if !unitChanged && input.CarryFinancialAccount != nil {
		return nil, pkg.BadRequestError("RenewalUnitUnchangedForAccountFlag", nil)
	}

	moveOut := leaseEndDate(input.MoveInDate, input.StayDuration, input.StayDurationFrequency)

	// Occupancy is asked over the renewal's own dates, and the parent is
	// excluded — otherwise every same-unit renewal on a single-occupant room
	// would be refused by the lease it is continuing.
	occupying, occErr := s.repo.CountOccupyingUnitForTerm(
		ctx, unitID, input.MoveInDate, moveOut, []string{parent.ID.String()},
	)
	if occErr != nil {
		return nil, pkg.InternalServerError(occErr.Error(), &pkg.RentLoopErrorParams{
			Err:      occErr,
			Metadata: map[string]string{"function": "RenewLease", "action": "counting occupancy"},
		})
	}

	unit, unitErr := s.unitService.GetUnitByID(ctx, unitID)
	if unitErr != nil {
		return nil, unitErr
	}
	if !UnitHasCapacity(occupying, int64(unit.MaxOccupantsAllowed)) {
		return nil, pkg.BadRequestError("UnitAtCapacityForTerm", nil)
	}

	for _, fee := range input.Fees {
		if fee.Amount <= 0 {
			return nil, pkg.BadRequestError("RenewalFeeMustBePositive", nil)
		}
		if !RenewalFeeCategoryAllowed(fee.Category) {
			return nil, pkg.BadRequestError("RenewalFeeCategoryInvalid", nil)
		}
	}

	rentFee := parent.RentFee
	if input.RentFee != nil {
		rentFee = *input.RentFee
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	parentID := parent.ID.String()

	child, createErr := s.CreateLease(transCtx, CreateLeaseInput{
		Status:                    "Lease.Status.Pending",
		Type:                      models.LeaseTypeRenewal,
		UnitId:                    unitID,
		TenantId:                  parent.TenantId,
		TenantApplicationId:       parent.TenantApplicationId,
		RentFee:                   rentFee,
		RentFeeCurrency:           parent.RentFeeCurrency,
		PaymentFrequency:          parent.PaymentFrequency,
		MoveInDate:                input.MoveInDate,
		StayDuration:              input.StayDuration,
		StayDurationFrequency:     input.StayDurationFrequency,
		LeaseAgreementDocumentUrl: input.LeaseAgreementDocumentUrl,
		ParentLeaseId:             &parentID,
	})
	if createErr != nil {
		transaction.Rollback()
		return nil, createErr
	}

	if linkErr := s.linkRenewalFinancials(
		transCtx, parent, child, unit, input, unitChanged, rentFee,
	); linkErr != nil {
		transaction.Rollback()
		return nil, linkErr
	}

	// The destination gains a tenancy. On a same-unit renewal this is a no-op
	// — the unit is already occupied by the parent — but on a move it is what
	// marks the new room taken. The SOURCE unit is not touched here:
	// CompleteLease frees it when the parent finishes.
	if statusErr := s.recomputeUnitOccupancy(transCtx, unit); statusErr != nil {
		transaction.Rollback()
		return nil, statusErr
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err:      commitErr,
			Metadata: map[string]string{"function": "RenewLease", "action": "committing transaction"},
		})
	}

	return child, nil
}

// linkRenewalFinancials gives the new term its money: the parent's account, or
// a fresh one, plus its own rent definition and instances.
//
// A parent with no account is not an error — charges may never have been
// prepared. The renewal is then created without financials, mirroring what
// approval already does.
//
// `unit` is the DESTINATION unit, passed in rather than read off `child`:
// CreateLease does not preload associations, so `child.Unit` is a zero value
// and a new account would be opened with no property.
func (s *leaseService) linkRenewalFinancials(
	ctx context.Context,
	parent, child *models.Lease,
	unit *models.Unit,
	input RenewLeaseInput,
	unitChanged bool,
	rentFee int64,
) error {
	if parent.FinancialAccountID == nil {
		return nil
	}

	carry := true
	if unitChanged && input.CarryFinancialAccount != nil {
		carry = *input.CarryFinancialAccount
	}

	accountID := *parent.FinancialAccountID

	if carry {
		account, accountErr := s.financials.Accounts.GetByID(ctx, accountID)
		if accountErr != nil {
			return accountErr
		}

		switch account.Status {
		case financials.StatusClosed:
			// Unlike the advisory eligibility recompute elsewhere, this cannot
			// be skipped when the service is absent: proceeding would attach a
			// new term to a closed ledger that refuses charges.
			if s.financials.Closure == nil {
				return pkg.InternalServerError(
					"closure service unavailable",
					&pkg.RentLoopErrorParams{
						Metadata: map[string]string{
							"function": "linkRenewalFinancials",
							"action":   "reopening a closed account for a renewal",
						},
					},
				)
			}

			/*
			 * The tenancy was tidied away and the tenant then renewed. Closure
			 * is bookkeeping, not a statement that the relationship ended, so
			 * a renewal undoes it rather than starting a second ledger beside
			 * it — which would split one tenant's money across two accounts
			 * for no reason a landlord could see.
			 *
			 * Reopen, not Revive: only Reopen clears ClosedAt and stamps the
			 * closure row, so the reversal leaves a trail instead of silently
			 * rewriting history.
			 */
			if reopenErr := s.financials.Closure.Reopen(ctx, financials.ReopenAccountInput{
				FinancialAccountID: accountID,
				ReopenedByID:       input.ClientUserID,
				Reason: fmt.Sprintf(
					"Reopened by a renewal of lease %s — the tenancy continued", parent.Code,
				),
			}); reopenErr != nil {
				return reopenErr
			}
		default:
			// A renewal negotiated after the parent ended lands on an account
			// that already looks finished. Reviving it is what stops a second
			// account opening for the same tenancy. A no-op unless the account
			// is CLOSURE_ELIGIBLE.
			if reviveErr := s.financials.Accounts.Revive(ctx, accountID); reviveErr != nil {
				return reviveErr
			}
		}
	} else {
		parentAccount, accErr := s.financials.Accounts.GetByID(ctx, accountID)
		if accErr != nil {
			return accErr
		}

		opened, openErr := s.financials.Accounts.OpenForLease(ctx, financials.OpenForLeaseInput{
			OriginTenantApplicationID: parentAccount.OriginTenantApplicationID,
			TenantID:                  child.TenantId,
			Currency:                  parent.RentFeeCurrency,
			ClientID:                  parentAccount.ClientID,
			PropertyID:                &unit.PropertyID,
		})
		if openErr != nil {
			return openErr
		}

		accountID = opened.ID.String()
	}

	childID := child.ID.String()
	if linkErr := s.SetFinancialAccount(ctx, childID, accountID); linkErr != nil {
		return linkErr
	}

	// The parent's rent template is superseded. Without closing it the account
	// would carry two ACTIVE templates and two answers to "what is the rent?".
	if closeErr := s.financials.Charges.CloseDefinitionsForLease(
		ctx, accountID, parent.ID.String(),
	); closeErr != nil {
		return closeErr
	}

	if parent.PaymentFrequency == nil {
		// No rent schedule to build, but the PM may still have asked for a
		// one-off — a renewal fee does not depend on rent being set up.
		return s.raiseRenewalFees(ctx, accountID, childID, parent.RentFeeCurrency, input)
	}

	// SecurityDepositFee is deliberately 0: a renewal never re-charges the
	// deposit on its own. A top-up arrives as an explicit fee below, because a
	// person asked for it.
	if err := s.financials.Charges.MaterialiseForAccount(ctx, financials.MaterialiseForAccountInput{
		FinancialAccountID:    accountID,
		LeaseID:               &childID,
		RentFee:               rentFee,
		Currency:              parent.RentFeeCurrency,
		PaymentFrequency:      *parent.PaymentFrequency,
		MoveInDate:            input.MoveInDate,
		StayDuration:          input.StayDuration,
		StayDurationFrequency: input.StayDurationFrequency,
		SecurityDepositFee:    0,
	}); err != nil {
		return err
	}

	return s.raiseRenewalFees(ctx, accountID, childID, parent.RentFeeCurrency, input)
}

// raiseRenewalFees creates the one-off charges the PM asked for, scoped to the
// new term.
//
// They are due on the term's first day rather than spread across it: these are
// the amounts paid to start the term, which is also what makes them collectable
// in the same breath as the first month's rent.
func (s *leaseService) raiseRenewalFees(
	ctx context.Context,
	accountID, childID, currency string,
	input RenewLeaseInput,
) error {
	for _, fee := range input.Fees {
		if _, err := s.financials.Charges.CreateAdHoc(ctx, financials.CreateAdHocChargeInput{
			FinancialAccountID: accountID,
			LeaseID:            &childID,
			Name:               fee.Name,
			Category:           fee.Category,
			Amount:             fee.Amount,
			Currency:           currency,
			DueDate:            input.MoveInDate,
		}); err != nil {
			return err
		}
	}

	return nil
}

// recomputeUnitOccupancy mirrors ApproveTenantApplication: count what holds the
// unit now, compare against capacity, and only write when the status changes.
func (s *leaseService) recomputeUnitOccupancy(ctx context.Context, unit *models.Unit) error {
	occupying, err := s.repo.CountActiveByUnitID(ctx, unit.ID.String())
	if err != nil {
		return err
	}

	var newStatus string
	switch {
	case occupying >= int64(unit.MaxOccupantsAllowed):
		newStatus = "Unit.Status.Occupied"
	case occupying > 0:
		newStatus = "Unit.Status.PartiallyOccupied"
	default:
		return nil
	}

	if unit.Status == newStatus {
		return nil
	}

	return s.unitService.SetSystemUnitStatus(ctx, UpdateUnitStatusInput{
		PropertyID: unit.PropertyID,
		UnitID:     unit.ID.String(),
		Status:     newStatus,
	})
}
