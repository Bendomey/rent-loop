package repository

import (
	"strings"
	"testing"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

func occupancyForTermSQL(t *testing.T, unitID string, start, end time.Time, exclude []string) string {
	t.Helper()

	var count int64
	db := applyOccupancyForTermScope(
		dryRunDB(t).Model(&models.Lease{}), unitID, start, end, exclude,
	)

	return db.Count(&count).Statement.SQL.String()
}

// Occupancy is asked over the renewal's dates, not "right now" — a unit free
// today may already be let for the term being renewed into.
func TestOccupancyForTermFiltersByDateRange(t *testing.T) {
	sql := occupancyForTermSQL(t, "11111111-1111-1111-1111-111111111111",
		time.Now(), time.Now().AddDate(1, 0, 0), nil)

	if !strings.Contains(sql, "move_in_date") || !strings.Contains(sql, "move_out_date") {
		t.Errorf("expected a date-range predicate, got: %s", sql)
	}
	if !strings.Contains(sql, "unit_id") {
		t.Errorf("expected a unit predicate, got: %s", sql)
	}
}

// The parent must not count against its own renewal, or every same-unit
// renewal on a single-occupant room would be refused.
func TestOccupancyForTermExcludesTheChain(t *testing.T) {
	sql := occupancyForTermSQL(t, "11111111-1111-1111-1111-111111111111",
		time.Now(), time.Now().AddDate(1, 0, 0),
		[]string{"22222222-2222-2222-2222-222222222222"})

	if !strings.Contains(sql, "id NOT IN") && !strings.Contains(sql, "id <> ") {
		t.Errorf("expected an exclusion predicate, got: %s", sql)
	}
}

// Only leases that actually hold the unit count.
func TestOccupancyForTermCountsOnlyLiveStatuses(t *testing.T) {
	sql := occupancyForTermSQL(t, "11111111-1111-1111-1111-111111111111",
		time.Now(), time.Now().AddDate(1, 0, 0), nil)

	if !strings.Contains(sql, "status IN") {
		t.Errorf("expected a status predicate, got: %s", sql)
	}
}
