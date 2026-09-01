package services

import (
	"testing"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

// The reason string stops claiming activity. "Active lease" is wrong for a
// lease that has not started, and the block is now written before it does.
func TestLeaseBlockInputNamesTheLease(t *testing.T) {
	moveOut := time.Date(2027, 3, 1, 0, 0, 0, 0, time.UTC)
	lease := models.Lease{
		Code:        "2602ABC123-1",
		UnitId:      "unit-1",
		MoveInDate:  time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC),
		MoveOutDate: &moveOut,
	}

	got := leaseBlockInput(lease)

	if got.Reason != "System block for lease #2602ABC123-1" {
		t.Errorf("got reason %q, want the lease code", got.Reason)
	}
	if got.BlockType != "LEASE" {
		t.Errorf("got block type %q, want LEASE", got.BlockType)
	}
}

// One tenancy, one bed. A lease is never an absolute hold — that is what
// lets a two-bed room carry a second tenant.
func TestLeaseBlockInputOccupiesOneSlot(t *testing.T) {
	moveOut := time.Date(2027, 3, 1, 0, 0, 0, 0, time.UTC)
	lease := models.Lease{MoveInDate: time.Now(), MoveOutDate: &moveOut}

	got := leaseBlockInput(lease)

	if got.SlotsOccupied == nil || *got.SlotsOccupied != 1 {
		t.Errorf("got %v, want 1", got.SlotsOccupied)
	}
}

// An open-ended lease has no move-out date computed yet; the block still
// needs an end, and the term derivation is the same one the lease uses.
func TestLeaseBlockInputFallsBackToDerivedEnd(t *testing.T) {
	lease := models.Lease{
		MoveInDate:            time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC),
		StayDuration:          6,
		StayDurationFrequency: "MONTHLY",
	}

	got := leaseBlockInput(lease)

	want := leaseEndDate(lease.MoveInDate, lease.StayDuration, lease.StayDurationFrequency)
	if !got.EndDate.Equal(want) {
		t.Errorf("got end %v, want %v", got.EndDate, want)
	}
}
