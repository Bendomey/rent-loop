package financials

import "sort"

// FillOldestFirst distributes amount across charges, oldest due date first,
// taking as much of each charge as is still uninvoiced before moving on.
//
// One function serves three callers — ComposeByAmount, the default path in
// AllocatePayment, and the historical backfill — so that the backfill
// reproduces exactly what the engine would have produced live.
//
// Sign discipline: only charges with the same sign as amount are candidates.
// A positive payment can never settle a refund owed to the tenant, and vice
// versa. Everything else is ordinary arithmetic on absolute values.
//
// Returns the claims and any unfilled remainder. A remainder is not an error —
// the caller holds it as account credit.
func FillOldestFirst(charges []ChargeView, amount int64) ([]Claim, int64) {
	if amount == 0 {
		return nil, 0
	}

	negative := amount < 0

	candidates := make([]ChargeView, 0, len(charges))
	for _, c := range charges {
		available := c.UninvoicedAmount()
		if available == 0 {
			continue
		}
		if (available < 0) != negative {
			continue
		}
		candidates = append(candidates, c)
	}

	sort.SliceStable(candidates, func(i, j int) bool {
		return candidates[i].DueDate.Before(candidates[j].DueDate)
	})

	remaining := abs64(amount)
	claims := make([]Claim, 0, len(candidates))

	for _, c := range candidates {
		if remaining == 0 {
			break
		}

		available := abs64(c.UninvoicedAmount())
		take := available
		if remaining < take {
			take = remaining
		}

		claims = append(claims, Claim{
			ChargeInstanceID: c.ID,
			Amount:           signed(take, negative),
		})
		remaining -= take
	}

	return claims, signed(remaining, negative)
}

func abs64(v int64) int64 {
	if v < 0 {
		return -v
	}
	return v
}

func signed(v int64, negative bool) int64 {
	if negative {
		return -v
	}
	return v
}
