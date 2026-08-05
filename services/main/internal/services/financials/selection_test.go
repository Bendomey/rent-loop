package financials

import (
	"testing"
)

func rentMonths(t *testing.T, months []string) []ChargeView {
	t.Helper()
	out := make([]ChargeView, 0, len(months))
	for _, m := range months {
		out = append(out, ChargeView{
			ID:       m,
			Category: CategoryRent,
			Amount:   100_000,
			DueDate:  mustDate(t, m),
		})
	}
	return out
}

// EVERY_PERIOD bills exactly one period when one falls inside the lead window.
func TestSelectIssuableEveryPeriodTakesOne(t *testing.T) {
	charges := rentMonths(t, []string{"2027-01-01", "2027-02-01", "2027-03-01"})
	now := mustDate(t, "2026-12-28") // 4 days before Jan 1, inside a 5-day lead

	got := SelectIssuableCharges(charges, now, RentBillingPolicy{Cadence: CadenceEveryPeriod, Interval: 1}, 5)

	if len(got) != 1 || got[0].ID != "2027-01-01" {
		t.Fatalf("got %+v, want a single January charge", got)
	}
}

// The regression this whole split exists for: a 12-period interval with a
// 5-day window must bill TWELVE lines, not one. The window only decides
// whether to fire; the cadence decides how many to take, drawn from ALL
// issuable charges regardless of due date.
func TestSelectIssuableEveryNPeriodsTakesFullIntervalBeyondWindow(t *testing.T) {
	months := []string{
		"2027-01-01", "2027-02-01", "2027-03-01", "2027-04-01",
		"2027-05-01", "2027-06-01", "2027-07-01", "2027-08-01",
		"2027-09-01", "2027-10-01", "2027-11-01", "2027-12-01",
	}
	charges := rentMonths(t, months)
	now := mustDate(t, "2026-12-28")

	got := SelectIssuableCharges(charges, now, RentBillingPolicy{Cadence: CadenceEveryNPeriods, Interval: 12}, 5)

	if len(got) != 12 {
		t.Fatalf("got %d charges, want 12 — the lead window must not cap the quantity", len(got))
	}
	if got[0].ID != "2027-01-01" || got[11].ID != "2027-12-01" {
		t.Errorf("got range %s..%s, want 2027-01-01..2027-12-01", got[0].ID, got[11].ID)
	}
}

// UPFRONT bills the whole remaining term on its first trigger.
func TestSelectIssuableUpfrontTakesEverything(t *testing.T) {
	charges := rentMonths(t, []string{"2027-01-01", "2027-02-01", "2027-03-01"})
	now := mustDate(t, "2026-12-28")

	got := SelectIssuableCharges(charges, now, RentBillingPolicy{Cadence: CadenceUpfront, Interval: 1}, 5)

	if len(got) != 3 {
		t.Fatalf("got %d charges, want 3", len(got))
	}
}

// Nothing due soon enough means nothing is issued — not a partial invoice.
func TestSelectIssuableNoTriggerIssuesNothing(t *testing.T) {
	charges := rentMonths(t, []string{"2027-01-01", "2027-02-01"})
	now := mustDate(t, "2026-11-01") // two months early

	got := SelectIssuableCharges(charges, now, RentBillingPolicy{Cadence: CadenceEveryNPeriods, Interval: 12}, 5)

	if len(got) != 0 {
		t.Fatalf("got %d charges, want 0", len(got))
	}
}

// MANUAL never auto-issues, however overdue the charges are.
func TestSelectIssuableManualNeverIssues(t *testing.T) {
	charges := rentMonths(t, []string{"2027-01-01"})
	now := mustDate(t, "2027-06-01")

	got := SelectIssuableCharges(charges, now, RentBillingPolicy{Cadence: CadenceManual, Interval: 1}, 5)

	if len(got) != 0 {
		t.Fatalf("got %d charges, want 0", len(got))
	}
}

// The ad-hoc prepayment case, end to end through selection. A landlord billed
// and collected Jan-Mar in December; the sweep must skip them and resume at
// April with no cancellation of anything.
func TestSelectIssuableSkipsPrepaidPeriods(t *testing.T) {
	charges := []ChargeView{
		{
			ID: "jan", Category: CategoryRent, Amount: 100_000,
			InvoicedAmount: 100_000, SettledAmount: 100_000, DueDate: mustDate(t, "2027-01-01"),
		},
		{
			ID: "feb", Category: CategoryRent, Amount: 100_000,
			InvoicedAmount: 100_000, SettledAmount: 100_000, DueDate: mustDate(t, "2027-02-01"),
		},
		{
			ID: "mar", Category: CategoryRent, Amount: 100_000,
			InvoicedAmount: 100_000, SettledAmount: 100_000, DueDate: mustDate(t, "2027-03-01"),
		},
		{ID: "apr", Category: CategoryRent, Amount: 100_000, DueDate: mustDate(t, "2027-04-01")},
	}
	now := mustDate(t, "2027-03-28")

	got := SelectIssuableCharges(charges, now, RentBillingPolicy{Cadence: CadenceEveryPeriod, Interval: 1}, 5)

	if len(got) != 1 || got[0].ID != "apr" {
		t.Fatalf("got %+v, want a single April charge", got)
	}
}

// Overdue charges stay issuable — an unbilled arrear must not fall out of the
// window and become invisible forever.
func TestSelectIssuableIncludesOverdue(t *testing.T) {
	charges := rentMonths(t, []string{"2027-01-01"})
	now := mustDate(t, "2027-05-01")

	got := SelectIssuableCharges(charges, now, RentBillingPolicy{Cadence: CadenceEveryPeriod, Interval: 1}, 5)

	if len(got) != 1 {
		t.Fatalf("got %d charges, want 1", len(got))
	}
}

// Only rent participates in cadence-driven issuance. One-off charges are
// composed ad-hoc by the landlord and must not be swept up silently.
func TestSelectIssuableIgnoresNonRentCategories(t *testing.T) {
	charges := []ChargeView{
		{ID: "dep", Category: CategorySecurityDeposit, Amount: 100_000, DueDate: mustDate(t, "2027-01-01")},
		{ID: "jan", Category: CategoryRent, Amount: 100_000, DueDate: mustDate(t, "2027-01-01")},
	}
	now := mustDate(t, "2026-12-28")

	got := SelectIssuableCharges(charges, now, RentBillingPolicy{Cadence: CadenceEveryPeriod, Interval: 1}, 5)

	if len(got) != 1 || got[0].ID != "jan" {
		t.Fatalf("got %+v, want only the rent charge", got)
	}
}
