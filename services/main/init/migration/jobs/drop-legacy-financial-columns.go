package jobs

import (
	"fmt"

	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// DropLegacyFinancialColumns is Job 3 — the point of no return.
//
// It runs only after BackfillFinancialAccounts has verified clean against a
// production dump. The two guards below are a last line of defence: they check
// the DATA, not the code, so they cannot tell you whether the call sites have
// been migrated. Verify that separately (scripts/verify-financial-backfill.sql
// plus a build) before deploying.
func DropLegacyFinancialColumns() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608050003_DROP_LEGACY_FINANCIAL_COLUMNS",
		Migrate: func(db *gorm.DB) error {
			// Guard 1: expense-derived invoices must still be able to derive a
			// property, or they fall out of every Cube property scope and
			// historical revenue silently drops.
			var strandedExpenseInvoices int64
			if err := db.Raw(`
				SELECT COUNT(*) FROM invoices
				WHERE context_expense_id IS NOT NULL AND payer_property_id IS NULL
			`).Scan(&strandedExpenseInvoices).Error; err != nil {
				return err
			}
			if strandedExpenseInvoices > 0 {
				return fmt.Errorf(
					"refusing to drop columns: %d expense-derived invoice(s) have no derivable property; "+
						"re-run BackfillFinancialAccounts",
					strandedExpenseInvoices,
				)
			}

			// Guard 2: no invoice may lose its lease/application link.
			var orphanedInvoices int64
			if err := db.Raw(`
				SELECT COUNT(*) FROM invoices
				WHERE (context_lease_id IS NOT NULL OR context_tenant_application_id IS NOT NULL)
				  AND financial_account_id IS NULL
				  AND deleted_at IS NULL
			`).Scan(&orphanedInvoices).Error; err != nil {
				return err
			}
			if orphanedInvoices > 0 {
				return fmt.Errorf(
					"refusing to drop columns: %d invoice(s) carry a lease/application context but no "+
						"financial account; re-run BackfillFinancialAccounts",
					orphanedInvoices,
				)
			}

			statements := []string{
				`ALTER TABLE invoices DROP COLUMN IF EXISTS context_expense_id`,
				`ALTER TABLE invoices DROP COLUMN IF EXISTS context_lease_id`,
				`ALTER TABLE invoices DROP COLUMN IF EXISTS context_tenant_application_id`,
				`ALTER TABLE expenses DROP COLUMN IF EXISTS context_lease_id`,
				`ALTER TABLE leases   DROP COLUMN IF EXISTS next_billing_date`,
				`DROP TABLE IF EXISTS lease_payments`,
			}
			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}
			return nil
		},
		Rollback: func(db *gorm.DB) error {
			// Restores STRUCTURE ONLY. The data these columns held is gone —
			// restore from backup if you need it back.
			statements := []string{
				`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS context_expense_id UUID`,
				`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS context_lease_id UUID`,
				`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS context_tenant_application_id UUID`,
				`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS context_lease_id UUID`,
				`ALTER TABLE leases   ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ`,
			}
			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}
			return nil
		},
	}
}
