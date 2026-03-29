package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// DropExpenseInvoicePaidByBillable removes invoice_id, paid_by, and billable_to_tenant from expenses.
// Invoicing is now tracked via invoices.context_expense_id instead.
func DropExpenseInvoicePaidByBillable() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202603270002_DROP_EXPENSE_INVOICE_PAID_BY_BILLABLE",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE expenses DROP COLUMN IF EXISTS invoice_id`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE expenses DROP COLUMN IF EXISTS paid_by`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE expenses DROP COLUMN IF EXISTS billable_to_tenant`).Error; err != nil {
				return err
			}
			return nil
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS billable_to_tenant BOOLEAN NOT NULL DEFAULT false`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS paid_by TEXT NOT NULL DEFAULT ''`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id)`).Error; err != nil {
				return err
			}
			return nil
		},
	}
}
