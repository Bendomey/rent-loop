package availability

import (
	"sort"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

// BlockDay reduces a term boundary to the calendar day it falls on.
//
// Blocks are stored in whole days, so a term carrying a time of day has to be
// put in the same units before it is compared with them. Left as written, a
// term ending at 09:00 on the 1st "overlaps" a block that starts at midnight
// on the 1st, and two tenancies that abut cleanly in the table refuse each
// other on the way in.
func BlockDay(t time.Time) time.Time {
	utc := t.UTC()
	return time.Date(utc.Year(), utc.Month(), utc.Day(), 0, 0, 0, 0, time.UTC)
}

// BlockRange is the half-open span of days a term claims.
//
// A term that starts and ends inside one day — an hourly stay — still holds
// that day. Stored as written it would collapse to a zero-width row, which
// the overlap query never returns and the saturation count never sees, so the
// stay would claim nothing at all.
func BlockRange(start, end time.Time) (time.Time, time.Time) {
	from, to := BlockDay(start), BlockDay(end)
	if !to.After(from) {
		to = from.AddDate(0, 0, 1)
	}
	return from, to
}

// SaturatedRange is a half-open [Start, End) span in which the unit's
// occupancy is at or above capacity.
type SaturatedRange struct {
	Start time.Time
	End   time.Time
}

type boundary struct {
	at    time.Time
	delta int
}

// SaturatedRanges returns the spans where the given blocks fill the unit.
//
// A day is unavailable when the blocks covering it reach capacity — not when
// any block touches the window. A six-month term can cross three blocks in a
// two-bed room without a single day carrying two.
//
// An absolute block contributes capacity rather than setting the count to it:
// the running total must be symmetric across the block's own boundaries, and
// for the at-or-above test the two are the same answer.
//
// Ranges are not clamped to any query window; the caller owns that.
func SaturatedRanges(blocks []models.UnitDateBlock, capacity int) []SaturatedRange {
	boundaries := make([]boundary, 0, len(blocks)*2)
	for _, b := range blocks {
		weight := capacity
		if b.SlotsOccupied != nil {
			weight = *b.SlotsOccupied
		}
		if !b.EndDate.After(b.StartDate) {
			continue
		}
		boundaries = append(boundaries,
			boundary{at: b.StartDate, delta: weight},
			boundary{at: b.EndDate, delta: -weight},
		)
	}

	sort.Slice(boundaries, func(i, j int) bool {
		if boundaries[i].at.Equal(boundaries[j].at) {
			return boundaries[i].delta < boundaries[j].delta
		}
		return boundaries[i].at.Before(boundaries[j].at)
	})

	ranges := []SaturatedRange{}
	running := 0
	for i := 0; i < len(boundaries); i++ {
		running += boundaries[i].delta

		next := i + 1
		for next < len(boundaries) && boundaries[next].at.Equal(boundaries[i].at) {
			i = next
			running += boundaries[i].delta
			next = i + 1
		}
		if next >= len(boundaries) {
			break
		}

		if running < capacity {
			continue
		}

		span := SaturatedRange{Start: boundaries[i].at, End: boundaries[next].at}
		if last := len(ranges) - 1; last >= 0 && ranges[last].End.Equal(span.Start) {
			ranges[last].End = span.End
			continue
		}
		ranges = append(ranges, span)
	}

	return ranges
}

// FirstSaturatedOverlap returns the earliest saturated span that [start, end)
// runs into, or nil when the term is clear. Half-open on both sides, so a
// term beginning exactly where a range ends does not touch it.
func FirstSaturatedOverlap(start, end time.Time, ranges []SaturatedRange) *SaturatedRange {
	for i, r := range ranges {
		if r.Start.Before(end) && r.End.After(start) {
			return &ranges[i]
		}
	}
	return nil
}

// TermIntersectsSaturated reports whether [start, end) touches any saturated
// span.
func TermIntersectsSaturated(start, end time.Time, ranges []SaturatedRange) bool {
	return FirstSaturatedOverlap(start, end, ranges) != nil
}

// TruncatedEnd is the end date a block should carry once its lease has
// actually ended. Never later than the term it was written for, and never
// before the term's own start — a termination recorded before the tenant ever
// moved in would otherwise invert the range.
func TruncatedEnd(start, originalEnd, actualEnd time.Time) time.Time {
	end := originalEnd
	if actualEnd.Before(originalEnd) {
		end = actualEnd
	}
	if end.Before(start) {
		return start
	}
	return end
}

// BlocksExcludingChain drops the blocks belonging to a lease's own renewal
// lineage, so a term is not refused by the chain it continues.
func BlocksExcludingChain(blocks []models.UnitDateBlock, chain []string) []models.UnitDateBlock {
	excluded := make(map[string]bool, len(chain))
	for _, id := range chain {
		excluded[id] = true
	}

	kept := make([]models.UnitDateBlock, 0, len(blocks))
	for _, b := range blocks {
		if b.LeaseID != nil && excluded[*b.LeaseID] {
			continue
		}
		kept = append(kept, b)
	}
	return kept
}
