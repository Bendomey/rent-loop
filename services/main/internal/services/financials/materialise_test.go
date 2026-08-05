package financials

import (
	"errors"
	"testing"
	"time"
)

func mustDate(t *testing.T, s string) time.Time {
	t.Helper()
	d, err := time.Parse("2006-01-02", s)
	if err != nil {
		t.Fatalf("bad date %q: %v", s, err)
	}
	return d
}

// The ordinary case: a twelve-month term billed monthly produces exactly
// twelve dated instances, each holding ONE period at the agreed rate. The
// total obligation is the sum of these, never a stored figure.
func TestMaterialiseRentTwelveMonths(t *testing.T) {
	got, err := MaterialiseRentInstances(MaterialiseRentInput{
		RentFee:               100_000,
		Currency:              "GHS",
		PaymentFrequency:      "MONTHLY",
		MoveInDate:            mustDate(t, "2027-01-01"),
		StayDuration:          12,
		StayDurationFrequency: "MONTHLY",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 12 {
		t.Fatalf("got %d instances, want 12", len(got))
	}

	var total int64
	for _, d := range got {
		if d.Amount != 100_000 {
			t.Errorf("instance %q amount %d, want 100000 (one period, not a multiple)", d.Name, d.Amount)
		}
		total += d.Amount
	}
	if total != 1_200_000 {
		t.Errorf("total %d, want 1200000", total)
	}

	if !got[0].PeriodStart.Equal(mustDate(t, "2027-01-01")) {
		t.Errorf("first period starts %v, want 2027-01-01", got[0].PeriodStart)
	}
	if !got[11].PeriodStart.Equal(mustDate(t, "2027-12-01")) {
		t.Errorf("last period starts %v, want 2027-12-01", got[11].PeriodStart)
	}
}

// The grace period is a payment grace AFTER the billing date, and it must be
// preserved exactly — backfilled due dates have to match invoices tenants have
// already received. Monthly grace is 7 days (lib.RentInvoiceGracePeriod).
func TestMaterialiseRentAppliesGracePeriodToDueDate(t *testing.T) {
	got, err := MaterialiseRentInstances(MaterialiseRentInput{
		RentFee:               100_000,
		Currency:              "GHS",
		PaymentFrequency:      "MONTHLY",
		MoveInDate:            mustDate(t, "2027-01-01"),
		StayDuration:          2,
		StayDurationFrequency: "MONTHLY",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := mustDate(t, "2027-01-08") // 2027-01-01 + 7 days
	if !got[0].DueDate.Equal(want) {
		t.Errorf("due date %v, want %v", got[0].DueDate, want)
	}
}

// A term expressed in years with monthly billing still yields one instance per
// BILLING period, not per term unit.
func TestMaterialiseRentAnnualTermMonthlyBilling(t *testing.T) {
	got, err := MaterialiseRentInstances(MaterialiseRentInput{
		RentFee:               100_000,
		Currency:              "GHS",
		PaymentFrequency:      "MONTHLY",
		MoveInDate:            mustDate(t, "2027-01-01"),
		StayDuration:          1,
		StayDurationFrequency: "ANNUALLY",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 12 {
		t.Fatalf("got %d instances, want 12", len(got))
	}
}

// The 2099 sentinel must never generate hundreds of rows.
func TestMaterialiseRentRejectsSentinelTerm(t *testing.T) {
	_, err := MaterialiseRentInstances(MaterialiseRentInput{
		RentFee:               100_000,
		Currency:              "GHS",
		PaymentFrequency:      "MONTHLY",
		MoveInDate:            mustDate(t, "2027-01-01"),
		StayDuration:          900,
		StayDurationFrequency: "MONTHLY",
	})
	if !errors.Is(err, ErrTermTooLong) {
		t.Fatalf("got error %v, want ErrTermTooLong", err)
	}
}

// A one-time payment frequency has no recurrence and must produce nothing
// rather than looping forever.
func TestMaterialiseRentOneTimeProducesNothing(t *testing.T) {
	got, err := MaterialiseRentInstances(MaterialiseRentInput{
		RentFee:               100_000,
		Currency:              "GHS",
		PaymentFrequency:      "OneTime",
		MoveInDate:            mustDate(t, "2027-01-01"),
		StayDuration:          12,
		StayDurationFrequency: "MONTHLY",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 0 {
		t.Fatalf("got %d instances, want 0", len(got))
	}
}
