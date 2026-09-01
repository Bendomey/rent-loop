package transformations

import (
	"testing"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/gofrs/uuid"
)

// A nil scope is the absolute hold every block carries today. It must survive
// the transformation as null rather than becoming a zero, which would read as
// "occupies no beds".
func TestDBUnitDateBlockToRestKeepsNilSlots(t *testing.T) {
	id, _ := uuid.NewV4()
	block := &models.UnitDateBlock{BlockType: "MAINTENANCE"}
	block.ID = id

	out, ok := DBUnitDateBlockToRest(block).(map[string]any)
	if !ok {
		t.Fatal("got a non-map transformation result")
	}

	if out["slots_occupied"] != (*int)(nil) {
		t.Errorf("got %v, want a nil *int", out["slots_occupied"])
	}
}

func TestDBUnitDateBlockToRestCarriesSlots(t *testing.T) {
	id, _ := uuid.NewV4()
	one := 1
	block := &models.UnitDateBlock{BlockType: "LEASE", SlotsOccupied: &one}
	block.ID = id

	out, _ := DBUnitDateBlockToRest(block).(map[string]any)
	got, _ := out["slots_occupied"].(*int)
	if got == nil || *got != 1 {
		t.Errorf("got %v, want 1", out["slots_occupied"])
	}
}

func TestSaturatedRangesToRestFormatsDates(t *testing.T) {
	ranges := []services.SaturatedRange{{
		Start: time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC),
		End:   time.Date(2026, 9, 10, 0, 0, 0, 0, time.UTC),
	}}

	out := SaturatedRangesToRest(ranges)

	if len(out) != 1 {
		t.Fatalf("got %d ranges, want 1", len(out))
	}
	if out[0].StartDate != "2026-09-01" {
		t.Errorf("got start %q, want 2026-09-01", out[0].StartDate)
	}
	if out[0].EndDate != "2026-09-10" {
		t.Errorf("got end %q, want 2026-09-10", out[0].EndDate)
	}
}

// No blocks means no ranges, and the field must still be an empty array
// rather than null — a picker that has to null-check before iterating is a
// picker that will forget to.
func TestSaturatedRangesToRestIsEmptyNotNil(t *testing.T) {
	if out := SaturatedRangesToRest(nil); out == nil || len(out) != 0 {
		t.Errorf("got %v, want an empty slice", out)
	}
}
