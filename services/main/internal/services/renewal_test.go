package services

import (
	"testing"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

// A live tenancy and a finished one can both be renewed. The first is the
// normal case — you renew before the tenant's term lapses, not after.
func TestCanRenewParentAcceptsActiveAndCompleted(t *testing.T) {
	for _, status := range []string{"Lease.Status.Active", "Lease.Status.Completed"} {
		if !CanRenewParent(status) {
			t.Errorf("got not renewable for %q, want renewable", status)
		}
	}
}

// Pending has nothing to renew yet; Cancelled never ran; Terminated ended
// early, which is a new tenancy rather than a continuation of this one.
func TestCanRenewParentRejectsTheRest(t *testing.T) {
	for _, status := range []string{
		"Lease.Status.Pending", "Lease.Status.Cancelled", "Lease.Status.Terminated",
	} {
		if CanRenewParent(status) {
			t.Errorf("got renewable for %q, want not renewable", status)
		}
	}
}

// One renewal per parent. Without this a double-click makes two.
func TestHasBlockingRenewalWithActiveChild(t *testing.T) {
	children := []models.Lease{{Status: "Lease.Status.Pending"}}

	if !HasBlockingRenewal(children) {
		t.Error("got no block, want blocked — a Pending renewal already exists")
	}
}

// A cancelled renewal deliberately does NOT block a retry: the PM cancelled it
// precisely so they could create a corrected one.
func TestHasBlockingRenewalIgnoresCancelledChild(t *testing.T) {
	children := []models.Lease{{Status: "Lease.Status.Cancelled"}}

	if HasBlockingRenewal(children) {
		t.Error("got blocked, want no block — a cancelled renewal allows a retry")
	}
}

func TestHasBlockingRenewalNoChildren(t *testing.T) {
	if HasBlockingRenewal(nil) {
		t.Error("got blocked, want no block — there are no children")
	}
}

// Starting before the parent ends means the tenant holds one room twice.
func TestOverlapsParentTermRejectsEarlyStart(t *testing.T) {
	parentOut := time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)
	moveIn := time.Date(2026, 8, 15, 0, 0, 0, 0, time.UTC)

	if !OverlapsParentTerm(moveIn, &parentOut) {
		t.Error("got no overlap, want overlap — the renewal starts mid-parent-term")
	}
}

// Continuous is the normal renewal: the new term starts the day the old ends.
func TestOverlapsParentTermAllowsContinuous(t *testing.T) {
	parentOut := time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)

	if OverlapsParentTerm(parentOut, &parentOut) {
		t.Error("got overlap, want none — starting exactly at move-out is continuous")
	}
}

// A gap is legitimate — a tenant may be away for a month before returning.
func TestOverlapsParentTermAllowsGap(t *testing.T) {
	parentOut := time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)
	moveIn := time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC)

	if OverlapsParentTerm(moveIn, &parentOut) {
		t.Error("got overlap, want none — a gap between terms is allowed")
	}
}

// An open-ended parent has no move-out to overlap with.
func TestOverlapsParentTermNilMoveOut(t *testing.T) {
	if OverlapsParentTerm(time.Now(), nil) {
		t.Error("got overlap, want none — the parent has no move-out date")
	}
}

// A single-occupant room with nobody else in it has room for the renewal.
func TestUnitHasCapacityEmpty(t *testing.T) {
	if !UnitHasCapacity(0, 1) {
		t.Error("got no capacity, want capacity — the unit is empty")
	}
}

// The destination is already full, so a move into it must be refused.
func TestUnitHasCapacityFull(t *testing.T) {
	if UnitHasCapacity(1, 1) {
		t.Error("got capacity, want none — the unit is at its limit")
	}
}

// Multi-occupant rooms are the reason this is a count and not a boolean:
// a room holding two of four tenants still has space.
func TestUnitHasCapacityMultiOccupant(t *testing.T) {
	if !UnitHasCapacity(2, 4) {
		t.Error("got no capacity, want capacity — 2 of 4 occupied")
	}
}
