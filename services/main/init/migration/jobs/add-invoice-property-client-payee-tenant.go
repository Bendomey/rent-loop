package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddInvoicePropertyClientPayeeTenant adds property_id, client_id, payee_tenant_id, and context_expense_id columns to invoices
// for easier querying and reporting without traversing the lease → unit → property chain.
func AddInvoicePropertyClientPayeeTenant() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202603270001_ADD_INVOICE_PROPERTY_CLIENT_PAYEE_TENANT",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id)`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id)`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payee_tenant_id UUID REFERENCES tenants(id)`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS context_expense_id UUID REFERENCES expenses(id)`).Error; err != nil {
				return err
			}
			return nil
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE invoices DROP COLUMN IF EXISTS context_expense_id`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE invoices DROP COLUMN IF EXISTS payee_tenant_id`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE invoices DROP COLUMN IF EXISTS client_id`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE invoices DROP COLUMN IF EXISTS property_id`).Error; err != nil {
				return err
			}
			return nil
		},
	}
}
