package repository

import (
	"strings"
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

func excludeRenewedSQL(t *testing.T, exclude *bool) string {
	t.Helper()

	var count int64
	db := dryRunDB(t).Model(&models.Lease{}).Scopes(excludeRenewedLeasesScope(exclude))

	return db.Count(&count).Statement.SQL.String()
}

// The filter is opt-in: every existing caller passes nothing and must keep
// seeing every lease, renewed or not.
func TestExcludeRenewedIsOptIn(t *testing.T) {
	off := false

	for name, value := range map[string]*bool{"unset": nil, "false": &off} {
		t.Run(name, func(t *testing.T) {
			if sql := excludeRenewedSQL(t, value); strings.Contains(sql, "parent_lease_id") {
				t.Errorf("expected no renewal predicate, got: %s", sql)
			}
		})
	}
}

// A renewed lease is excluded by the existence of a live child, and only a
// Terminated or Cancelled child lets the parent count as expiring again.
func TestExcludeRenewedDropsLeasesWithALiveRenewal(t *testing.T) {
	on := true
	sql := excludeRenewedSQL(t, &on)

	for _, fragment := range []string{
		"NOT EXISTS",
		"renewal.parent_lease_id = leases.id",
		"renewal.deleted_at IS NULL",
		"Lease.Status.Terminated",
		"Lease.Status.Cancelled",
	} {
		if !strings.Contains(sql, fragment) {
			t.Errorf("expected %q in the query, got: %s", fragment, sql)
		}
	}

	// Pending and Active children must NOT appear: they are exactly the
	// renewals that should suppress the parent.
	if strings.Contains(sql, "Lease.Status.Active") || strings.Contains(sql, "Lease.Status.Pending") {
		t.Errorf("a live renewal status leaked into the exclusion, got: %s", sql)
	}
}
