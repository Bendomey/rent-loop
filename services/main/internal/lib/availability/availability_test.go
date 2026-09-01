package availability

import (
	"testing"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

func day(d int) time.Time {
	return time.Date(2026, 9, d, 0, 0, 0, 0, time.UTC)
}

func slot(n int) *int { return &n }

func block(start, end int, slots *int) models.UnitDateBlock {
	return models.UnitDateBlock{StartDate: day(start), EndDate: day(end), SlotsOccupied: slots}
}

// A free room. Nothing to disable, and the picker must not look different
// from today.
func TestSaturatedRangesEmptyWhenNoBlocks(t *testing.T) {
	if got := SaturatedRanges(nil, 1); len(got) != 0 {
		t.Errorf("got %d ranges, want 0", len(got))
	}
}

// The ordinary case: a sitting tenant in a single-occupant room.
func TestSaturatedRangesSingleOccupantRoom(t *testing.T) {
	got := SaturatedRanges([]models.UnitDateBlock{block(1, 10, slot(1))}, 1)

	if len(got) != 1 {
		t.Fatalf("got %d ranges, want 1", len(got))
	}
	if !got[0].Start.Equal(day(1)) || !got[0].End.Equal(day(10)) {
		t.Errorf("got %v–%v, want %v–%v", got[0].Start, got[0].End, day(1), day(10))
	}
}

// A shared room below capacity. Blocks exist and no day is saturated —
// blocks alone must never grey out a date.
func TestSaturatedRangesSharedRoomBelowCapacity(t *testing.T) {
	got := SaturatedRanges([]models.UnitDateBlock{block(1, 10, slot(1))}, 2)

	if len(got) != 0 {
		t.Errorf("got %d ranges, want 0 — one bed of two is still free", len(got))
	}
}

// A booking and a lease together reach capacity, so a span IS saturated
// despite the room never being wholly held by either.
func TestSaturatedRangesBookingAndLeaseTogetherSaturate(t *testing.T) {
	got := SaturatedRanges([]models.UnitDateBlock{
		block(1, 20, slot(1)),
		block(5, 8, slot(1)),
	}, 2)

	if len(got) != 1 {
		t.Fatalf("got %d ranges, want 1", len(got))
	}
	if !got[0].Start.Equal(day(5)) || !got[0].End.Equal(day(8)) {
		t.Errorf("got %v–%v, want %v–%v", got[0].Start, got[0].End, day(5), day(8))
	}
}

// Three blocks touch a two-bed room, yet no single day carries two. Counting
// per window would see three and refuse work that is perfectly valid.
func TestSaturatedRangesCountsPerDayNotPerWindow(t *testing.T) {
	got := SaturatedRanges([]models.UnitDateBlock{
		block(1, 5, slot(1)),
		block(8, 12, slot(1)),
		block(15, 20, slot(1)),
	}, 2)

	if len(got) != 0 {
		t.Errorf("got %d ranges, want 0 — no day carries more than one", len(got))
	}
}

// An absolute block closes the room whatever its capacity. One broken
// four-bed room is still a closed room when the block says so.
func TestSaturatedRangesAbsoluteBlockSaturatesSharedRoom(t *testing.T) {
	got := SaturatedRanges([]models.UnitDateBlock{block(3, 6, nil)}, 4)

	if len(got) != 1 {
		t.Fatalf("got %d ranges, want 1", len(got))
	}
	if !got[0].Start.Equal(day(3)) || !got[0].End.Equal(day(6)) {
		t.Errorf("got %v–%v, want %v–%v", got[0].Start, got[0].End, day(3), day(6))
	}
}

// Back-to-back terms leave no gap between them: the second claims the day
// the first releases, so the room is continuously full. The boundary must
// not produce a zero-width range or a seam in the middle of the stretch.
func TestSaturatedRangesBackToBackTermsAreOneStretch(t *testing.T) {
	got := SaturatedRanges([]models.UnitDateBlock{
		block(1, 10, slot(1)),
		block(10, 20, slot(1)),
	}, 1)

	if len(got) != 1 {
		t.Fatalf("got %d ranges, want 1 continuous stretch", len(got))
	}
	if !got[0].Start.Equal(day(1)) || !got[0].End.Equal(day(20)) {
		t.Errorf("got %v–%v, want %v–%v", got[0].Start, got[0].End, day(1), day(20))
	}
}

// The boundary day belongs to whoever claims it next — and when nobody does,
// it is free. This is the rule every renewal depends on.
func TestSaturatedRangesLeavesTheDayATermEndsFree(t *testing.T) {
	got := SaturatedRanges([]models.UnitDateBlock{block(1, 10, slot(1))}, 1)

	if len(got) != 1 {
		t.Fatalf("got %d ranges, want 1", len(got))
	}
	if TermIntersectsSaturated(day(10), day(20), got) {
		t.Error("got the following term refused, want it clear — it starts the day the first ends")
	}
}

// Adjacent saturated spans are reported as one. Two consecutive full terms
// are a single stretch of unavailability to a picker.
func TestSaturatedRangesMergesAdjacentSpans(t *testing.T) {
	got := SaturatedRanges([]models.UnitDateBlock{block(1, 10, nil), block(5, 15, nil)}, 1)

	if len(got) != 1 {
		t.Fatalf("got %d ranges, want 1 merged", len(got))
	}
	if !got[0].Start.Equal(day(1)) || !got[0].End.Equal(day(15)) {
		t.Errorf("got %v–%v, want %v–%v", got[0].Start, got[0].End, day(1), day(15))
	}
}

// A term that ends exactly where a saturated range begins does not intersect
// it — the same half-open rule the block query uses.
func TestTermIntersectsSaturatedHalfOpen(t *testing.T) {
	ranges := []SaturatedRange{{Start: day(10), End: day(20)}}

	if TermIntersectsSaturated(day(1), day(10), ranges) {
		t.Error("got intersecting, want clear — the term ends where the range starts")
	}
	if !TermIntersectsSaturated(day(1), day(11), ranges) {
		t.Error("got clear, want intersecting — the term runs one day into the range")
	}
	if TermIntersectsSaturated(day(20), day(30), ranges) {
		t.Error("got intersecting, want clear — the term starts where the range ends")
	}
}

// Early termination frees the room from the day it is recorded. Truncating
// to the actual end is the honest model — any notice period belongs to the
// PM, not the schema.
func TestTruncatedEndUsesTheEarlierDate(t *testing.T) {
	if got := TruncatedEnd(day(1), day(20), day(12)); !got.Equal(day(12)) {
		t.Errorf("got %v, want the actual end %v", got, day(12))
	}
}

// A termination recorded after the term would have ended anyway must not
// extend the claim.
func TestTruncatedEndNeverExtends(t *testing.T) {
	if got := TruncatedEnd(day(1), day(20), day(25)); !got.Equal(day(20)) {
		t.Errorf("got %v, want the original end %v", got, day(20))
	}
}

// The refusal names the span the term actually runs into, not merely the
// first span in the list.
func TestFirstSaturatedOverlapPicksTheCollidingSpan(t *testing.T) {
	ranges := []SaturatedRange{{Start: day(1), End: day(5)}, {Start: day(10), End: day(20)}}

	got := FirstSaturatedOverlap(day(8), day(12), ranges)

	if got == nil {
		t.Fatal("got no overlap, want the second span")
	}
	if !got.Start.Equal(day(10)) {
		t.Errorf("got the span starting %v, want %v", got.Start, day(10))
	}
}

func TestFirstSaturatedOverlapNilWhenClear(t *testing.T) {
	ranges := []SaturatedRange{{Start: day(10), End: day(20)}}

	if got := FirstSaturatedOverlap(day(1), day(10), ranges); got != nil {
		t.Errorf("got %v, want nil — the term ends where the span starts", got)
	}
}

// A termination recorded before the tenant ever moved in must not invert the
// block — an end before its start is invisible to every consumer and invalid.
func TestTruncatedEndNeverPrecedesTheStart(t *testing.T) {
	if got := TruncatedEnd(day(10), day(20), day(3)); !got.Equal(day(10)) {
		t.Errorf("got %v, want the start %v", got, day(10))
	}
}

// Terms carry a time of day; blocks are stored in whole days. Comparing them
// as written made a term ending at 09:00 collide with a block starting at
// midnight the same day, so clean back-to-back tenancies refused each other.
func TestBlockRangeFloorsBothEndsToDays(t *testing.T) {
	start := time.Date(2026, 9, 1, 9, 30, 0, 0, time.UTC)
	end := time.Date(2026, 12, 1, 9, 30, 0, 0, time.UTC)

	from, to := BlockRange(start, end)

	if !from.Equal(time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)) {
		t.Errorf("got start %v, want the 1st at midnight", from)
	}
	if !to.Equal(time.Date(2026, 12, 1, 0, 0, 0, 0, time.UTC)) {
		t.Errorf("got end %v, want December 1st at midnight", to)
	}
}

// An hourly stay begins and ends on one day. Floored alone it would be a
// zero-width block — dropped by the saturation count and never returned by the
// overlap query — so the stay would claim nothing at all.
func TestBlockRangeGivesASubDayTermItsDay(t *testing.T) {
	start := time.Date(2026, 9, 1, 9, 0, 0, 0, time.UTC)

	from, to := BlockRange(start, start.Add(4*time.Hour))

	if !to.After(from) {
		t.Fatalf("got %v–%v, want a day-wide claim", from, to)
	}
	if got := SaturatedRanges(
		[]models.UnitDateBlock{{StartDate: from, EndDate: to, SlotsOccupied: slot(1)}}, 1,
	); len(got) != 1 {
		t.Errorf("got %d ranges, want the hourly stay to hold its day", len(got))
	}
}

// The day a term ends stays free for the next one, even when the terms carry
// times of day. This is the back-to-back handover the guard used to refuse.
func TestBlockRangeLeavesTheHandoverDayFree(t *testing.T) {
	first, firstEnd := BlockRange(
		time.Date(2026, 9, 1, 9, 30, 0, 0, time.UTC),
		time.Date(2026, 12, 1, 9, 30, 0, 0, time.UTC),
	)
	ranges := SaturatedRanges(
		[]models.UnitDateBlock{{StartDate: first, EndDate: firstEnd, SlotsOccupied: slot(1)}}, 1,
	)

	nextStart, nextEnd := BlockRange(
		time.Date(2026, 12, 1, 9, 30, 0, 0, time.UTC),
		time.Date(2027, 3, 1, 9, 30, 0, 0, time.UTC),
	)
	if TermIntersectsSaturated(nextStart, nextEnd, ranges) {
		t.Error("got the following term refused, want it clear — it starts the day the first ends")
	}
}
