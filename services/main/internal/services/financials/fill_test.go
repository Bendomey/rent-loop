package financials

import (
	"testing"
)

func chargeAt(id string, amount int64, day string, t *testing.T) ChargeView {
	t.Helper()
	return ChargeView{ID: id, Category: CategoryRent, Amount: amount, DueDate: mustDate(t, day)}
}

// The worked example from the design: 2,500 against a deposit and three months
// of rent fills the two oldest completely and partial-claims the third.
func TestFillOldestFirstPartialTail(t *testing.T) {
	charges := []ChargeView{
		{ID: "dep", Category: CategorySecurityDeposit, Amount: 100_000, DueDate: mustDate(t, "2027-01-01")},
		chargeAt("jan", 100_000, "2027-01-01", t),
		chargeAt("feb", 100_000, "2027-02-01", t),
		chargeAt("mar", 100_000, "2027-03-01", t),
	}

	claims, remainder := FillOldestFirst(charges, 250_000)

	if remainder != 0 {
		t.Errorf("remainder %d, want 0", remainder)
	}
	if len(claims) != 3 {
		t.Fatalf("got %d claims, want 3", len(claims))
	}
	if claims[0].Amount != 100_000 || claims[1].Amount != 100_000 {
		t.Errorf("first two claims %v/%v, want both 100000", claims[0].Amount, claims[1].Amount)
	}
	if claims[2].Amount != 50_000 {
		t.Errorf("tail claim %d, want 50000 (partial)", claims[2].Amount)
	}
}

// Ordering is by due date, not input order — arrears must clear first.
func TestFillOldestFirstOrdersByDueDate(t *testing.T) {
	charges := []ChargeView{
		chargeAt("mar", 100_000, "2027-03-01", t),
		chargeAt("jan", 100_000, "2027-01-01", t),
		chargeAt("feb", 100_000, "2027-02-01", t),
	}

	claims, _ := FillOldestFirst(charges, 100_000)

	if len(claims) != 1 || claims[0].ChargeInstanceID != "jan" {
		t.Fatalf("got %+v, want a single claim on jan", claims)
	}
}

// Already-invoiced portions are not available to claim again.
func TestFillOldestFirstSkipsInvoicedPortion(t *testing.T) {
	charges := []ChargeView{
		{
			ID:             "jan",
			Category:       CategoryRent,
			Amount:         100_000,
			InvoicedAmount: 80_000,
			DueDate:        mustDate(t, "2027-01-01"),
		},
		chargeAt("feb", 100_000, "2027-02-01", t),
	}

	claims, remainder := FillOldestFirst(charges, 100_000)

	if remainder != 0 {
		t.Errorf("remainder %d, want 0", remainder)
	}
	if len(claims) != 2 {
		t.Fatalf("got %d claims, want 2", len(claims))
	}
	if claims[0].Amount != 20_000 {
		t.Errorf("jan claim %d, want 20000 (only the uninvoiced remainder)", claims[0].Amount)
	}
	if claims[1].Amount != 80_000 {
		t.Errorf("feb claim %d, want 80000", claims[1].Amount)
	}
}

// Money beyond what is owed comes back as a remainder rather than being
// rejected — the caller turns it into account credit.
func TestFillOldestFirstReturnsRemainderAsCredit(t *testing.T) {
	charges := []ChargeView{chargeAt("jan", 100_000, "2027-01-01", t)}

	claims, remainder := FillOldestFirst(charges, 150_000)

	if len(claims) != 1 || claims[0].Amount != 100_000 {
		t.Fatalf("got %+v, want a single full claim", claims)
	}
	if remainder != 50_000 {
		t.Errorf("remainder %d, want 50000", remainder)
	}
}

// Fully invoiced and voided charges are not candidates at all.
func TestFillOldestFirstIgnoresExhaustedCharges(t *testing.T) {
	charges := []ChargeView{
		{
			ID:             "jan",
			Category:       CategoryRent,
			Amount:         100_000,
			InvoicedAmount: 100_000,
			DueDate:        mustDate(t, "2027-01-01"),
		},
		chargeAt("feb", 100_000, "2027-02-01", t),
	}

	claims, _ := FillOldestFirst(charges, 100_000)

	if len(claims) != 1 || claims[0].ChargeInstanceID != "feb" {
		t.Fatalf("got %+v, want a single claim on feb", claims)
	}
}

// Refunds fill with the same function. A negative amount consumes negative
// charges, so no branch on "is this a refund" is needed anywhere.
func TestFillOldestFirstHandlesNegativeCharges(t *testing.T) {
	charges := []ChargeView{
		{
			ID:       "dep-refund",
			Category: CategorySecurityDeposit,
			Amount:   -100_000,
			DueDate:  mustDate(t, "2027-06-01"),
		},
	}

	claims, remainder := FillOldestFirst(charges, -60_000)

	if len(claims) != 1 {
		t.Fatalf("got %d claims, want 1", len(claims))
	}
	if claims[0].Amount != -60_000 {
		t.Errorf("claim %d, want -60000", claims[0].Amount)
	}
	if remainder != 0 {
		t.Errorf("remainder %d, want 0", remainder)
	}
}

// A positive amount must never be filled against negative charges, or a rent
// payment would silently settle a refund the landlord owes.
func TestFillOldestFirstDoesNotCrossSigns(t *testing.T) {
	charges := []ChargeView{
		{
			ID:       "dep-refund",
			Category: CategorySecurityDeposit,
			Amount:   -100_000,
			DueDate:  mustDate(t, "2027-01-01"),
		},
		chargeAt("feb", 100_000, "2027-02-01", t),
	}

	claims, _ := FillOldestFirst(charges, 100_000)

	if len(claims) != 1 || claims[0].ChargeInstanceID != "feb" {
		t.Fatalf("got %+v, want a single claim on feb", claims)
	}
}

// Zero fills nothing rather than emitting empty claims.
func TestFillOldestFirstZeroAmount(t *testing.T) {
	charges := []ChargeView{chargeAt("jan", 100_000, "2027-01-01", t)}

	claims, remainder := FillOldestFirst(charges, 0)

	if len(claims) != 0 {
		t.Errorf("got %d claims, want 0", len(claims))
	}
	if remainder != 0 {
		t.Errorf("remainder %d, want 0", remainder)
	}
}
