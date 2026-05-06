package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddBookingConfirmedFields() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202605060001_ADD_BOOKING_CONFIRMED_FIELDS",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ`).Error; err != nil {
				return err
			}
			return db.Exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_by_id TEXT`).Error
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE bookings DROP COLUMN IF EXISTS confirmed_at`).Error; err != nil {
				return err
			}
			return db.Exec(`ALTER TABLE bookings DROP COLUMN IF EXISTS confirmed_by_id`).Error
		},
	}
}
