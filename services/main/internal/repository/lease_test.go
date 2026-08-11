package repository

import (
	"context"
	"strings"
	"testing"

	"gorm.io/gorm"
)

// leaseDueForBillingSQL renders the statement ListDueForBilling issues, without
// opening a connection. DryRun builds the SQL but skips execution, so a
// callback registered after the query build sees the finished statement.
func leaseDueForBillingSQL(t *testing.T) string {
	t.Helper()

	db := dryRunDB(t)

	var captured string
	if err := db.Callback().
		Query().
		After("gorm:query").
		Register("capture_due_for_billing_sql", func(tx *gorm.DB) {
			captured = tx.Statement.SQL.String()
		}); err != nil {
		t.Fatalf("registering capture callback: %v", err)
	}

	repo := &leaseRepository{DB: db}
	if _, err := repo.ListDueForBilling(context.Background()); err != nil {
		t.Fatalf("ListDueForBilling: %v", err)
	}

	if captured == "" {
		t.Fatal("no SQL captured -- the callback never ran")
	}

	return captured
}

// A lease whose deposit covers its whole term ends up with next_billing_date
// landing exactly on move_out_date: ActivateLease advances one cycle per
// covered period, and a 12-month deposit on a 12-month term lands on the last
// day. Billing then matches it (next_billing_date <= now) while completion
// still does not (move_out_date < startOfToday, i.e. the day after), so the
// lease is billed for a period that starts when the tenancy ends.
//
// That one-day window issued five real invoices -- INV-2608-RA0EV8 and four
// others -- to tenants whose leases had run out, and the reminder cron chased
// every one of them.
func TestListDueForBillingStopsAtLeaseTerm(t *testing.T) {
	sql := leaseDueForBillingSQL(t)

	// next_billing_date is the *start* of the period being billed -- the phantom
	// invoice was labelled "Rent – August 2026" off a next_billing_date of
	// 2026-08-01. So a period starting on move_out_date lies wholly outside the
	// tenancy, and the comparison has to be strict.
	if !strings.Contains(sql, "next_billing_date < move_out_date") {
		t.Errorf(
			"billing query does not stop at the end of the lease term, so a lease "+
				"whose next_billing_date equals its move_out_date is still billed "+
				"for a period beginning after the tenant has left:\n%s",
			sql,
		)
	}

	// Open-ended leases carry no move_out_date and must keep billing.
	if !strings.Contains(sql, "move_out_date IS NULL") {
		t.Errorf("guard drops open-ended leases instead of billing them:\n%s", sql)
	}
}
