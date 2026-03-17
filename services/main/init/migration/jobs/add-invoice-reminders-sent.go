package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddInvoiceRemindersSent() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202603170002_ADD_INVOICE_REMINDERS_SENT",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(
				`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminders_sent TEXT[] NOT NULL DEFAULT '{}'`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE invoices DROP COLUMN IF EXISTS reminders_sent`).Error
		},
	}
}
