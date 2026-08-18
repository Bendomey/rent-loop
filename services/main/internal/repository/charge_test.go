package repository

import (
	"strings"
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

func listInstancesSQL(t *testing.T, filters ListChargeInstancesFilter) string {
	t.Helper()

	var instances []models.ChargeInstance
	db := applyChargeInstanceFilters(dryRunDB(t).Model(&models.ChargeInstance{}), filters)

	return db.Find(&instances).Statement.SQL.String()
}

// The lease filter is what the UI's "This Lease" view runs on.
func TestListInstancesFiltersByLease(t *testing.T) {
	leaseID := "11111111-1111-1111-1111-111111111111"
	sql := listInstancesSQL(t, ListChargeInstancesFilter{LeaseID: &leaseID})

	if !strings.Contains(sql, "charge_instances.lease_id = ") {
		t.Errorf("expected a lease_id predicate, got: %s", sql)
	}
}

// Without the filter the query must stay account-wide — this is the "Entire
// Tenancy" view, and it is also what balance and allocation rely on.
func TestListInstancesWithoutLeaseIsAccountWide(t *testing.T) {
	accountID := "22222222-2222-2222-2222-222222222222"
	sql := listInstancesSQL(t, ListChargeInstancesFilter{FinancialAccountID: &accountID})

	if strings.Contains(sql, "lease_id") {
		t.Errorf("expected no lease predicate when none was asked for, got: %s", sql)
	}
	if !strings.Contains(sql, "charge_instances.financial_account_id = ") {
		t.Errorf("expected an account predicate, got: %s", sql)
	}
}

// Voided charges stay excluded by default even when a lease is named.
func TestListInstancesLeaseFilterStillExcludesVoided(t *testing.T) {
	leaseID := "11111111-1111-1111-1111-111111111111"
	sql := listInstancesSQL(t, ListChargeInstancesFilter{LeaseID: &leaseID})

	if !strings.Contains(sql, "voided_at IS NULL") {
		t.Errorf("expected voided charges to remain excluded, got: %s", sql)
	}
}
