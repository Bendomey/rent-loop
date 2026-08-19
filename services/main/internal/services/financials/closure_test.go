package financials

import (
	"testing"
	"time"
)

// Every term in the chain has ended and nothing follows. This is the only
// shape that may be closed.
func TestIsClosureEligibleAllEnded(t *testing.T) {
	terms := []LeaseTerm{
		{ID: "original", Status: "Lease.Status.Completed"},
		{ID: "renewal", Status: "Lease.Status.Terminated"},
	}
	if !IsClosureEligible(terms) {
		t.Error("got not eligible, want eligible — every term has ended")
	}
}

// THE dangerous case. An active lease on the account means the tenant is
// still living there. Closing would release their deposit while they hold
// the keys.
func TestIsClosureEligibleActiveLeaseBlocks(t *testing.T) {
	terms := []LeaseTerm{
		{ID: "original", Status: "Lease.Status.Completed"},
		{ID: "renewal", Status: "Lease.Status.Active"},
	}
	if IsClosureEligible(terms) {
		t.Error("got eligible, want not eligible — a lease is still Active")
	}
}

// A renewal signed but not yet activated is a successor. The spec's second
// condition ("no Pending or Active successor") needs no separate check:
// a successor is itself a lease on this account, so it fails the ended test.
func TestIsClosureEligiblePendingSuccessorBlocks(t *testing.T) {
	terms := []LeaseTerm{
		{ID: "original", Status: "Lease.Status.Completed"},
		{ID: "renewal", Status: "Lease.Status.Pending"},
	}
	if IsClosureEligible(terms) {
		t.Error("got eligible, want not eligible — a Pending successor exists")
	}
}

// A cancelled lease never ran, but it is over. It does not hold the account open.
func TestIsClosureEligibleCancelledCounts(t *testing.T) {
	terms := []LeaseTerm{{ID: "never-started", Status: "Lease.Status.Cancelled"}}
	if !IsClosureEligible(terms) {
		t.Error("got not eligible, want eligible — a cancelled lease is ended")
	}
}

// An account with no leases at all is at application stage. It has never
// been a tenancy, so it cannot have finished being one.
func TestIsClosureEligibleNoLeasesIsNotEligible(t *testing.T) {
	if IsClosureEligible(nil) {
		t.Error("got eligible, want not eligible — an account with no leases is application-stage")
	}
}

// The clean case: tenancy over, nothing owed, deposit dealt with, inspection
// on file.
func TestEvaluateClosureGatesAllPass(t *testing.T) {
	gates := EvaluateClosureGates(ClosureGateInput{
		Terms:              []LeaseTerm{{ID: "l1", Status: "Lease.Status.Completed"}},
		OutstandingAmount:  0,
		DepositHeldAmount:  500_000,
		DepositResolved:    true,
		HasMoveOutEvidence: true,
	})
	if !CanClose(gates) {
		t.Errorf("got cannot close, want can close: %+v", gates)
	}
}

// Money is still owed. Closing here would write off a debt silently.
func TestEvaluateClosureGatesOutstandingBlocks(t *testing.T) {
	gates := EvaluateClosureGates(ClosureGateInput{
		Terms:              []LeaseTerm{{ID: "l1", Status: "Lease.Status.Completed"}},
		OutstandingAmount:  120_000,
		DepositResolved:    true,
		HasMoveOutEvidence: true,
	})
	if CanClose(gates) {
		t.Error("got can close, want blocked — 120,000 is still outstanding")
	}
	if !gateIsBlocking(t, gates, GateOutstandingBalance) {
		t.Error("the outstanding balance gate must be blocking")
	}
}

// A deposit is held and the PM has not said what happens to it. Closing would
// leave the tenant's money in limbo.
func TestEvaluateClosureGatesUnresolvedDepositBlocks(t *testing.T) {
	gates := EvaluateClosureGates(ClosureGateInput{
		Terms:              []LeaseTerm{{ID: "l1", Status: "Lease.Status.Completed"}},
		DepositHeldAmount:  500_000,
		DepositResolved:    false,
		HasMoveOutEvidence: true,
	})
	if CanClose(gates) {
		t.Error("got can close, want blocked — a held deposit is unresolved")
	}
}

// No deposit was ever held, so there is nothing to resolve and the gate passes
// without the PM doing anything.
func TestEvaluateClosureGatesNoDepositPassesUnresolved(t *testing.T) {
	gates := EvaluateClosureGates(ClosureGateInput{
		Terms:              []LeaseTerm{{ID: "l1", Status: "Lease.Status.Completed"}},
		DepositHeldAmount:  0,
		DepositResolved:    false,
		HasMoveOutEvidence: true,
	})
	if !CanClose(gates) {
		t.Errorf("got cannot close, want can close — no deposit was held: %+v", gates)
	}
}

// Move-out evidence is advisory on purpose. A lease that simply runs to
// Completed never produces a termination record or a check-out checklist, so
// blocking on it would strand every clean tenancy.
func TestEvaluateClosureGatesMissingMoveOutWarnsOnly(t *testing.T) {
	gates := EvaluateClosureGates(ClosureGateInput{
		Terms:              []LeaseTerm{{ID: "l1", Status: "Lease.Status.Completed"}},
		DepositResolved:    true,
		HasMoveOutEvidence: false,
	})
	if !CanClose(gates) {
		t.Error("got blocked, want can close — missing move-out evidence only warns")
	}
	if gateIsBlocking(t, gates, GateMoveOutEvidence) {
		t.Error("the move-out gate must not be blocking")
	}
	if gatePassed(t, gates, GateMoveOutEvidence) {
		t.Error("the move-out gate should report as failed so the PM sees the warning")
	}
}

// An active lease blocks closure through the gates too, not only through
// IsClosureEligible.
func TestEvaluateClosureGatesActiveLeaseBlocks(t *testing.T) {
	gates := EvaluateClosureGates(ClosureGateInput{
		Terms:              []LeaseTerm{{ID: "l1", Status: "Lease.Status.Active"}},
		DepositResolved:    true,
		HasMoveOutEvidence: true,
	})
	if CanClose(gates) {
		t.Error("got can close, want blocked — a lease is still Active")
	}
}

func gateIsBlocking(t *testing.T, gates []ClosureGate, name string) bool {
	t.Helper()
	for _, g := range gates {
		if g.Name == name {
			return g.Blocking && !g.Passed
		}
	}
	t.Fatalf("gate %q not present in %+v", name, gates)
	return false
}

func gatePassed(t *testing.T, gates []ClosureGate, name string) bool {
	t.Helper()
	for _, g := range gates {
		if g.Name == name {
			return g.Passed
		}
	}
	t.Fatalf("gate %q not present in %+v", name, gates)
	return false
}

// The deposit currently held is the net of every SECURITY_DEPOSIT charge on
// the account: the original taken under lease #1, less any reversal already
// posted. It is computed account-wide precisely so a deposit taken under an
// earlier term is still visible when the tenancy ends under a later one.
func TestDepositHeldNetsReversals(t *testing.T) {
	views := []ChargeView{
		{ID: "deposit", Category: CategorySecurityDeposit, Amount: 500_000, SettledAmount: 500_000},
		{ID: "rent-jan", Category: CategoryRent, Amount: 100_000, SettledAmount: 100_000},
		{ID: "partial-refund", Category: CategorySecurityDeposit, Amount: -200_000},
	}

	if got := DepositHeld(views); got != 300_000 {
		t.Errorf("got %d, want 300000 — 500,000 taken less a 200,000 reversal", got)
	}
}

// No deposit was ever taken, so nothing is held and the closure gate has
// nothing to ask the PM about.
func TestDepositHeldNoDeposit(t *testing.T) {
	views := []ChargeView{{ID: "rent-jan", Category: CategoryRent, Amount: 100_000}}

	if got := DepositHeld(views); got != 0 {
		t.Errorf("got %d, want 0", got)
	}
}

// A deposit fully refunded leaves nothing held, so closure is not blocked on
// resolving it a second time.
func TestDepositHeldFullyRefunded(t *testing.T) {
	views := []ChargeView{
		{ID: "deposit", Category: CategorySecurityDeposit, Amount: 500_000, SettledAmount: 500_000},
		{ID: "refund", Category: CategorySecurityDeposit, Amount: -500_000},
	}

	if got := DepositHeld(views); got != 0 {
		t.Errorf("got %d, want 0", got)
	}
}

func TestIsDueForClosureWaitsOutTheGracePeriod(t *testing.T) {
	asOf := time.Date(2026, 8, 19, 0, 0, 0, 0, time.UTC)
	ninetyOne := asOf.AddDate(0, 0, -91)
	thirty := asOf.AddDate(0, 0, -30)
	exactly := asOf.AddDate(0, 0, -ClosureGraceDays)

	cases := []struct {
		name       string
		eligibleAt *time.Time
		want       bool
	}{
		{"past the grace period", &ninetyOne, true},
		{"exactly at the grace period", &exactly, true},
		{"still inside the grace period", &thirty, false},
		{"never became eligible", nil, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsDueForClosure(tc.eligibleAt, asOf); got != tc.want {
				t.Fatalf("IsDueForClosure = %v, want %v", got, tc.want)
			}
		})
	}
}
