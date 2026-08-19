package financials

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/pkg"
)

// Financial account statuses.
//
// CLOSURE_ELIGIBLE is not "closed pending paperwork" — it is a live account
// that merely looks finished. It still bills, still accepts payment, and
// reverts to ACTIVE the moment a new lease points at it.
const (
	StatusActive          = "ACTIVE"
	StatusClosureEligible = "CLOSURE_ELIGIBLE"
	StatusClosed          = "CLOSED"
)

// LeaseTerm is the minimal view of a lease that closure reasoning needs. The
// package stays free of the models import, which is what keeps these rules
// testable without a database.
type LeaseTerm struct {
	ID     string
	Status string
}

// isEndedLeaseStatus reports whether a lease is over by any route.
func isEndedLeaseStatus(status string) bool {
	switch status {
	case "Lease.Status.Terminated", "Lease.Status.Completed", "Lease.Status.Cancelled":
		return true
	default:
		return false
	}
}

// IsClosureEligible reports whether every term on an account has ended.
//
// The spec states two conditions — every lease ended, and no Pending or
// Active successor anywhere in the chain — but the second is subsumed by the
// first. A successor lease points at this same account, so an unfinished
// successor is an unfinished term and fails here. Keeping one predicate means
// there is one place to get this wrong.
//
// An empty set is deliberately NOT eligible. An account with no leases has
// never been a tenancy; it is a prepared application.
func IsClosureEligible(terms []LeaseTerm) bool {
	if len(terms) == 0 {
		return false
	}

	for _, term := range terms {
		if !isEndedLeaseStatus(term.Status) {
			return false
		}
	}

	return true
}

// Closure gate names. These travel to the UI, which renders one row per gate.
const (
	GateLeasesEnded        = "LEASES_ENDED"
	GateOutstandingBalance = "OUTSTANDING_BALANCE"
	GateDeposit            = "DEPOSIT"
	GateMoveOutEvidence    = "MOVE_OUT_EVIDENCE"
)

// ClosureGate is one condition shown to the property manager before closing.
// A gate that has not passed and is not blocking is a warning: the PM may
// close anyway.
type ClosureGate struct {
	Name     string `json:"name"`
	Passed   bool   `json:"passed"`
	Blocking bool   `json:"blocking"`
	Reason   string `json:"reason"`
}

// ClosureGateInput is everything the gates need, gathered by the caller so
// this stays pure.
type ClosureGateInput struct {
	Terms              []LeaseTerm
	OutstandingAmount  int64
	DepositHeldAmount  int64
	DepositResolved    bool
	HasMoveOutEvidence bool
}

// EvaluateClosureGates returns every gate in a stable order, passed or not.
// It never filters: the PM is shown the ones that passed as well, because a
// checklist with items missing is not a checklist.
func EvaluateClosureGates(in ClosureGateInput) []ClosureGate {
	ended := IsClosureEligible(in.Terms)
	depositOK := in.DepositHeldAmount == 0 || in.DepositResolved

	return []ClosureGate{
		{
			Name:     GateLeasesEnded,
			Passed:   ended,
			Blocking: true,
			Reason:   "Every lease on this account must have ended",
		},
		{
			Name:     GateOutstandingBalance,
			Passed:   in.OutstandingAmount == 0,
			Blocking: true,
			Reason:   "Outstanding balance must be settled, offset against the deposit, or written off",
		},
		{
			Name:     GateDeposit,
			Passed:   depositOK,
			Blocking: true,
			Reason:   "A held deposit must be released, offset, or forfeited with a reason",
		},
		{
			Name:     GateMoveOutEvidence,
			Passed:   in.HasMoveOutEvidence,
			Blocking: false,
			Reason:   "No check-out checklist or completed termination is on file",
		},
	}
}

// CanClose reports whether every blocking gate has passed. Advisory gates are
// ignored by design.
func CanClose(gates []ClosureGate) bool {
	for _, gate := range gates {
		if gate.Blocking && !gate.Passed {
			return false
		}
	}

	return true
}

// ClosureGraceDays is how long an account sits eligible before the sweep acts.
//
// Long enough that a late renewal still lands inside the window and revives
// the account on its own; short enough that finished tenancies do not pile up.
// The grace period is not protecting against error — the gates do that — it is
// protecting against acting while the manager still considers the tenancy live.
const ClosureGraceDays = 90

// IsDueForClosure reports whether an eligible account has waited long enough.
//
// asOf is passed rather than read from the clock: a 90-day rule is untestable
// by a suite that runs in seconds unless the instant is an input.
func IsDueForClosure(eligibleAt *time.Time, asOf time.Time) bool {
	if eligibleAt == nil {
		return false
	}

	return !eligibleAt.After(asOf.AddDate(0, 0, -ClosureGraceDays))
}

// AssertAccountOpen refuses a write against a closed account.
//
// A closed account that still accepts charges is not closed, it is merely
// labelled. Recording a payment is included: the outstanding gate means a
// closed account has no unpaid invoice, so there is nothing legitimate to
// receive.
//
// CLOSURE_ELIGIBLE deliberately passes. An eligible account is still open — a
// late charge on a tenancy that has just ended is ordinary, and refusing it
// would make the sweep's own grace period unusable.
func AssertAccountOpen(status string) error {
	if status == StatusClosed {
		return pkg.ConflictError("FinancialAccountClosed", nil)
	}

	return nil
}

// ReusableAccountStatuses is the set a tenancy lookup will join rather than
// bypass. CLOSED is deliberately absent: a tenant who left and came back
// years later starts a new financial relationship.
func ReusableAccountStatuses() []string {
	return []string{StatusActive, StatusClosureEligible}
}

// DepositHeld nets every SECURITY_DEPOSIT charge on the account.
//
// Sign carries direction throughout this package, so a negative
// SECURITY_DEPOSIT charge is a refund and simply subtracts. It is computed
// account-wide, never per lease: a deposit taken under the first term of a
// tenancy must still be visible when the last term ends.
func DepositHeld(views []ChargeView) int64 {
	var held int64

	for _, view := range views {
		if view.Category == CategorySecurityDeposit {
			held += view.Amount
		}
	}

	return held
}
