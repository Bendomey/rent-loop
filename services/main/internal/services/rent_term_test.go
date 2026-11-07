package services

import (
	"testing"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/services/financials"
)

// The rent schedule and the lease derive their end independently
// (financials.termEndDate and leaseEndDate), so this pins them together: the
// last rent period must close the day before the lease's move-out.
func TestRentScheduleEndsAtLeaseEnd(t *testing.T) {
	moveIn := time.Date(2026, 11, 7, 0, 0, 0, 0, time.UTC)

	drafts, err := financials.MaterialiseRentInstances(financials.MaterialiseRentInput{
		RentFee:               120_000,
		Currency:              "GHS",
		PaymentFrequency:      "MONTHLY",
		MoveInDate:            moveIn,
		StayDuration:          6,
		StayDurationFrequency: "MONTHLY",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	leaseEnd := leaseEndDate(moveIn, 6, "MONTHLY")
	if want := time.Date(2027, 5, 7, 0, 0, 0, 0, time.UTC); !leaseEnd.Equal(want) {
		t.Fatalf("lease end %v, want %v", leaseEnd, want)
	}
	if len(drafts) != 6 {
		t.Fatalf("got %d rent periods, want 6", len(drafts))
	}
	last := drafts[len(drafts)-1]
	if !last.PeriodEnd.AddDate(0, 0, 1).Equal(leaseEnd) {
		t.Errorf("last period ends %v, want the day before lease end %v", last.PeriodEnd, leaseEnd)
	}
}
