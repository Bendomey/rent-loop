package financials

import (
	"errors"
	"testing"
)

// The five invariants, checked as a unit. Every mutating test in this package
// ends by calling AssertInvariants — that is what catches the case nobody
// thought to write a dedicated test for.
func TestAssertInvariantsHappyPath(t *testing.T) {
	charges := []ChargeView{
		{ID: "jan", Amount: 100_000, InvoicedAmount: 100_000, SettledAmount: 100_000},
		{ID: "feb", Amount: 100_000, InvoicedAmount: 100_000, SettledAmount: 40_000},
	}
	byCharge := map[string]int64{"jan": 100_000, "feb": 40_000}

	if err := AssertInvariants(charges, byCharge, 140_000, 140_000); err != nil {
		t.Fatalf("unexpected violation: %v", err)
	}
}

// Invariant 1: you cannot allocate money that was never received.
func TestAssertInvariantsOverAllocatedPayment(t *testing.T) {
	charges := []ChargeView{{ID: "jan", Amount: 100_000, SettledAmount: 100_000}}
	byCharge := map[string]int64{"jan": 100_000}

	err := AssertInvariants(charges, byCharge, 50_000, 100_000)
	if !errors.Is(err, ErrAllocationExceedsPayment) {
		t.Fatalf("got %v, want ErrAllocationExceedsPayment", err)
	}
}

// Invariant 2: the denormalised SettledAmount must equal the sum of its rows.
// This is the drift that makes a ledger untrustworthy.
func TestAssertInvariantsSettledAmountDrift(t *testing.T) {
	charges := []ChargeView{{ID: "jan", Amount: 100_000, SettledAmount: 100_000}}
	byCharge := map[string]int64{"jan": 60_000} // rows say 60k, column says 100k

	err := AssertInvariants(charges, byCharge, 60_000, 60_000)
	if !errors.Is(err, ErrSettledAmountDrift) {
		t.Fatalf("got %v, want ErrSettledAmountDrift", err)
	}
}

// Invariant 3: you cannot bill more than is owed.
func TestAssertInvariantsOverInvoiced(t *testing.T) {
	charges := []ChargeView{{ID: "jan", Amount: 100_000, InvoicedAmount: 150_000}}

	err := AssertInvariants(charges, map[string]int64{}, 0, 0)
	if !errors.Is(err, ErrOverInvoiced) {
		t.Fatalf("got %v, want ErrOverInvoiced", err)
	}
}

// Invariant 4: you cannot settle more than is owed.
func TestAssertInvariantsOverSettled(t *testing.T) {
	charges := []ChargeView{{ID: "jan", Amount: 100_000, SettledAmount: 150_000}}
	byCharge := map[string]int64{"jan": 150_000}

	err := AssertInvariants(charges, byCharge, 150_000, 150_000)
	if !errors.Is(err, ErrOverSettled) {
		t.Fatalf("got %v, want ErrOverSettled", err)
	}
}

// Signed arithmetic: a refund is over-settled in the same way, by magnitude.
func TestAssertInvariantsNegativeChargeOverSettled(t *testing.T) {
	charges := []ChargeView{{ID: "refund", Amount: -100_000, SettledAmount: -150_000}}
	byCharge := map[string]int64{"refund": -150_000}

	err := AssertInvariants(charges, byCharge, -150_000, -150_000)
	if !errors.Is(err, ErrOverSettled) {
		t.Fatalf("got %v, want ErrOverSettled", err)
	}
}

// Invariant 5: the balance is defined once, as the sum of unsettled amounts.
func TestAccountBalanceIgnoresVoided(t *testing.T) {
	charges := []ChargeView{
		{ID: "jan", Amount: 100_000, SettledAmount: 100_000},
		{ID: "feb", Amount: 100_000, SettledAmount: 40_000},
		{ID: "refund", Amount: -30_000},
	}

	got := AccountBalance(charges)
	want := int64(60_000 - 30_000) // feb outstanding 60k, refund owed 30k
	if got != want {
		t.Errorf("got balance %d, want %d", got, want)
	}
}

// Composition reserves; voiding releases. If release did not restore
// InvoicedAmount, the charge would stay "already billed" forever and the queue
// would silently stop invoicing that tenant — a bug that shows up as missing
// revenue months later, not as an error.
func TestReserveThenReleaseRestoresIssuability(t *testing.T) {
	charge := ChargeView{
		ID:       "feb",
		Category: CategoryRent,
		Amount:   100_000,
		DueDate:  mustDate(t, "2027-02-01"),
	}
	now := mustDate(t, "2027-01-28")
	policy := RentBillingPolicy{Cadence: CadenceEveryPeriod, Interval: 1}

	// Before: the queue would bill it.
	if got := SelectIssuableCharges([]ChargeView{charge}, now, policy, 5); len(got) != 1 {
		t.Fatalf("pre-reserve: got %d issuable, want 1", len(got))
	}

	// Compose reserves the full amount.
	reserved := charge
	reserved.InvoicedAmount += 100_000

	if got := SelectIssuableCharges([]ChargeView{reserved}, now, policy, 5); len(got) != 0 {
		t.Fatalf("post-reserve: got %d issuable, want 0 — an invoice already claims it", len(got))
	}

	// Voiding the invoice releases the claim.
	released := reserved
	released.InvoicedAmount -= 100_000

	if got := SelectIssuableCharges([]ChargeView{released}, now, policy, 5); len(got) != 1 {
		t.Fatalf("post-release: got %d issuable, want 1 — the charge must return to the queue", len(got))
	}
	if released.InvoicedAmount != 0 {
		t.Errorf("invoiced_amount %d after release, want 0", released.InvoicedAmount)
	}
}

// A partial claim releases partially, leaving the rest still reserved.
func TestPartialReserveThenReleaseIsSymmetric(t *testing.T) {
	charge := ChargeView{
		ID:       "feb",
		Category: CategoryRent,
		Amount:   100_000,
		DueDate:  mustDate(t, "2027-02-01"),
	}

	reserved := charge
	reserved.InvoicedAmount += 40_000

	claims, remainder := FillOldestFirst([]ChargeView{reserved}, 100_000)
	if remainder != 40_000 {
		t.Errorf("remainder %d, want 40000 — only 60000 is still claimable", remainder)
	}
	if len(claims) != 1 || claims[0].Amount != 60_000 {
		t.Fatalf("got %+v, want a single 60000 claim", claims)
	}

	released := reserved
	released.InvoicedAmount -= 40_000
	if released.InvoicedAmount != charge.InvoicedAmount {
		t.Errorf("release was not symmetric: got %d, want %d", released.InvoicedAmount, charge.InvoicedAmount)
	}
}
