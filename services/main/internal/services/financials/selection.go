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

	cutoff := now.AddDate(0, 0, int(autoIssueDaysBefore))

	// Rent recurs, so the cadence decides how many periods to take. One-offs —
	// the deposit, agency fee, VAT, a damage recharge — do not recur, so they
	// are taken once, when due, and never multiplied by an interval.
	rent := make([]ChargeView, 0, len(charges))
	oneOffs := make([]ChargeView, 0, len(charges))
	for _, c := range charges {
		if c.UnsettledAmount() == 0 || c.UninvoicedAmount() == 0 {
			continue
		}
		if c.Category == CategoryRent {
			rent = append(rent, c)
			continue
		}
		// Same due-date test rent gets. Anything already past due keeps
		// qualifying, so a one-off can never be stranded.
		if !c.DueDate.After(cutoff) {
			oneOffs = append(oneOffs, c)
		}
	}

	byDueDate := func(s []ChargeView) {
		sort.SliceStable(s, func(i, j int) bool { return s[i].DueDate.Before(s[j].DueDate) })
	}
	byDueDate(rent)
	byDueDate(oneOffs)

	// 1. Trigger — a due one-off is reason enough to issue on its own. Without
	// that, a charge raised after the final rent period has no invoice to ride
	// along on and is never billed.
	triggered := len(oneOffs) > 0
	if !triggered {
		for _, c := range rent {
			if !c.DueDate.After(cutoff) {
				triggered = true
				break
			}
		}
	}
	if !triggered {
		return nil
	}

	// 2. Quantity — drawn from ALL issuable rent, not just what is inside the
	// window, so EVERY_N_PERIODS/12 bills twelve lines rather than one.
	take := len(rent)
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
	if take > len(rent) {
		take = len(rent)
	}

	return append(oneOffs, rent[:take]...)
}
