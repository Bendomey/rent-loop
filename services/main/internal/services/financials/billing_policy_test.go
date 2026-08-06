package financials

import "testing"

// 12,000 initial deposit on a 1,000/month unit means twelve months prepaid.
// It must become an interval, never a charge — a charge would double-count
// against the twelve rent instances that also exist.
func TestDeriveRentBillingPolicyTwelveMonthsUpfront(t *testing.T) {
	got := DeriveRentBillingPolicy(1_200_000, 100_000)
	if got.Cadence != CadenceEveryNPeriods {
		t.Errorf("got cadence %q, want %q", got.Cadence, CadenceEveryNPeriods)
	}
	if got.Interval != 12 {
		t.Errorf("got interval %d, want 12", got.Interval)
	}
}

// No initial deposit means ordinary period-by-period billing.
func TestDeriveRentBillingPolicyNoInitialDeposit(t *testing.T) {
	got := DeriveRentBillingPolicy(0, 100_000)
	if got.Cadence != CadenceEveryPeriod {
		t.Errorf("got cadence %q, want %q", got.Cadence, CadenceEveryPeriod)
	}
	if got.Interval != 1 {
		t.Errorf("got interval %d, want 1", got.Interval)
	}
}

// A deposit smaller than one period cannot cover a period, so it must not
// round down to a zero interval — that would make the queue take zero charges.
func TestDeriveRentBillingPolicyPartialPeriodFloorsToOne(t *testing.T) {
	got := DeriveRentBillingPolicy(50_000, 100_000)
	if got.Interval != 1 {
		t.Errorf("got interval %d, want 1", got.Interval)
	}
	if got.Cadence != CadenceEveryPeriod {
		t.Errorf("got cadence %q, want %q", got.Cadence, CadenceEveryPeriod)
	}
}

// A non-multiple deposit keeps its whole periods. The 500 remainder is not
// lost — it is claimed as a partial line on the next instance at composition
// time, which is strictly better than today's silent integer truncation.
func TestDeriveRentBillingPolicyNonMultipleKeepsWholePeriods(t *testing.T) {
	got := DeriveRentBillingPolicy(1_050_000, 100_000)
	if got.Interval != 10 {
		t.Errorf("got interval %d, want 10", got.Interval)
	}
}

// Guard against divide-by-zero on a free unit.
func TestDeriveRentBillingPolicyZeroRentFee(t *testing.T) {
	got := DeriveRentBillingPolicy(1_200_000, 0)
	if got.Cadence != CadenceEveryPeriod || got.Interval != 1 {
		t.Errorf("got %+v, want EVERY_PERIOD/1", got)
	}
}
