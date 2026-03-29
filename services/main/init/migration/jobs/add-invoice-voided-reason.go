package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddInvoiceVoidedReason() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202603290001_ADD_INVOICE_VOIDED_REASON",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				ALTER TABLE invoices ADD COLUMN IF NOT EXISTS voided_reason TEXT;
				ALTER TABLE invoices ADD COLUMN IF NOT EXISTS voided_by_client_user_id UUID REFERENCES client_users(id);
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`
				ALTER TABLE invoices DROP COLUMN IF EXISTS voided_reason;
				ALTER TABLE invoices DROP COLUMN IF EXISTS voided_by_client_user_id;
			`).Error
		},
	}
}
