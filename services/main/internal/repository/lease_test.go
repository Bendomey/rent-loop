package repository

import (
	"strings"
	"testing"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

// dueForActivationSQL renders the statement the activation sweep would send to
// the database, so the WHERE clause can be asserted without a connection.
func dueForActivationSQL(t *testing.T, now time.Time) string {
	t.Helper()

	var leases []models.Lease
	return dryRunDB(t).
		Scopes(dueForActivationScope(now)).
		Find(&leases).
		Statement.SQL.String()
}

func TestDueForActivationScopeSelectsPendingLeasesWhoseMoveInHasPassed(t *testing.T) {
	sql := dueForActivationSQL(t, time.Date(2026, 8, 18, 0, 0, 0, 0, time.UTC))

	if !strings.Contains(sql, "move_in_date <=") {
		t.Errorf("expected the scope to bound move_in_date, got:\n%s", sql)
	}
}

// A lease whose move-out has also passed must not be activated: the completion
// job takes it straight to Completed instead, so the tenant is not sent an
// "activated" notice minutes before a "completed" one.
func TestDueForActivationScopeExcludesLeasesWhoseMoveOutHasPassed(t *testing.T) {
	sql := dueForActivationSQL(t, time.Date(2026, 8, 18, 0, 0, 0, 0, time.UTC))

	if !strings.Contains(sql, "move_out_date IS NULL OR move_out_date >=") {
		t.Errorf("expected the scope to exclude leases already past move-out, got:\n%s", sql)
	}
}
