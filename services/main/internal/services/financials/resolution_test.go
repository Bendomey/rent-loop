package financials

import "testing"

// An eligible account is reusable. A lease that expired while its renewal was
// still being negotiated leaves the account CLOSURE_ELIGIBLE, and the renewal
// must revive that relationship rather than start a second one — otherwise the
// tenant's deposit and history are stranded on the old account.
func TestReusableAccountStatusesIncludesEligible(t *testing.T) {
	got := ReusableAccountStatuses()

	var hasActive, hasEligible, hasClosed bool
	for _, s := range got {
		switch s {
		case StatusActive:
			hasActive = true
		case StatusClosureEligible:
			hasEligible = true
		case StatusClosed:
			hasClosed = true
		}
	}

	if !hasActive {
		t.Error("ACTIVE must be reusable")
	}
	if !hasEligible {
		t.Error("CLOSURE_ELIGIBLE must be reusable — a late renewal has to revive it")
	}
	if hasClosed {
		t.Error("CLOSED must NOT be reusable — a returning tenant starts a new relationship")
	}
}
