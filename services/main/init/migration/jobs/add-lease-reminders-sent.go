package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddLeaseRemindersSent() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202607040002_ADD_LEASE_REMINDERS_SENT",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(
				`ALTER TABLE leases ADD COLUMN IF NOT EXISTS reminders_sent TEXT[] NOT NULL DEFAULT '{}'`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE leases DROP COLUMN IF EXISTS reminders_sent`).Error
		},
	}
}
