package financials

import (
	"sort"
	"time"
)

// SelectIssuableCharges decides which rent charges the queue should bill now.
//
// Two distinct steps, deliberately not collapsed into one filtered query:
//
//  1. TRIGGER — is anything due within the lead window? If not, issue nothing.
//  2. QUANTITY — how many to take, drawn from ALL issuable charges, not just
//     those inside the window.
//
// Collapsing them breaks EVERY_N_PERIODS and UPFRONT outright: with a 5-day
// window and a 12-period interval only the first period would ever be a
// candidate, so a 12-line invoice would silently become a 1-line invoice.
//
// Selection is over state, never a stored cursor. That is what makes ad-hoc
// prepayment self-handling: settled and fully-invoiced charges simply stop
// being candidates, so the sweep resumes at the right period with no
// compensating action.
func SelectIssuableCharges(
	charges []ChargeView,
	now time.Time,
	policy RentBillingPolicy,
	autoIssueDaysBefore int64,
) []ChargeView {
	if policy.Cadence == CadenceManual {
		return nil
	}

	issuable := make([]ChargeView, 0, len(charges))
	for _, c := range charges {
		if c.Category != CategoryRent {
			continue
		}
		if c.UnsettledAmount() == 0 || c.UninvoicedAmount() == 0 {
			continue
		}
		issuable = append(issuable, c)
	}

	sort.SliceStable(issuable, func(i, j int) bool {
		return issuable[i].DueDate.Before(issuable[j].DueDate)
	})

	// 1. Trigger.
	cutoff := now.AddDate(0, 0, int(autoIssueDaysBefore))
	triggered := false
	for _, c := range issuable {
		if !c.DueDate.After(cutoff) {
			triggered = true
			break
		}
	}
	if !triggered {
		return nil
	}

	// 2. Quantity.
	take := len(issuable)
	switch policy.Cadence {
	case CadenceEveryPeriod:
		take = 1
	case CadenceEveryNPeriods:
		if policy.Interval > 0 && int(policy.Interval) < take {
			take = int(policy.Interval)
		}
	case CadenceUpfront:
		// take everything
	}

	return issuable[:take]
}
