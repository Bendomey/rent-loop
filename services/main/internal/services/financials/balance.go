package financials

import "errors"

// The five invariants of the ledger. Violating any of them means the ledger no
// longer describes reality, so they are checked in tests after every mutation
// and are the acceptance criteria for the allocation engine.
var (
	ErrAllocationExceedsPayment = errors.New("allocations exceed the payment amount")
	ErrSettledAmountDrift       = errors.New("settled_amount does not match its allocation rows")
	ErrOverInvoiced             = errors.New("charge is invoiced beyond its amount")
	ErrOverSettled              = errors.New("charge is settled beyond its amount")
)

// AccountBalance is the ONE definition of what a tenant owes: the sum of every
// unsettled amount across non-voided charges. Positive means the tenant owes;
// negative means the landlord owes them.
//
// Callers must pass only non-voided charges — the repository excludes them by
// default.
func AccountBalance(charges []ChargeView) int64 {
	var total int64
	for _, c := range charges {
		total += c.UnsettledAmount()
	}
	return total
}

// AvailableCreditFrom computes account credit as the residue of payments that
// have not been fully allocated. There is deliberately no credit table: credit
// IS unallocated payment, so it cannot drift from the payments that created it.
func AvailableCreditFrom(paymentTotal, allocatedTotal int64) int64 {
	credit := paymentTotal - allocatedTotal
	if credit < 0 {
		return 0
	}
	return credit
}

// AssertInvariants checks all five conditions. allocationsByCharge maps a
// charge ID to the sum of its allocation rows.
func AssertInvariants(
	charges []ChargeView,
	allocationsByCharge map[string]int64,
	paymentTotal int64,
	allocatedTotal int64,
) error {
	if abs64(allocatedTotal) > abs64(paymentTotal) {
		return ErrAllocationExceedsPayment
	}

	for _, c := range charges {
		if abs64(c.InvoicedAmount) > abs64(c.Amount) {
			return ErrOverInvoiced
		}
		if abs64(c.SettledAmount) > abs64(c.Amount) {
			return ErrOverSettled
		}
		if rows, ok := allocationsByCharge[c.ID]; ok && rows != c.SettledAmount {
			return ErrSettledAmountDrift
		}
	}

	return nil
}
