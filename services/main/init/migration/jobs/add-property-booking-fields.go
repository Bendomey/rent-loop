package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddPropertyBookingFields() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604230001_ADD_PROPERTY_BOOKING_FIELDS",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS modes text[] NOT NULL DEFAULT '{}'`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS booking_requires_upfront_payment boolean NOT NULL DEFAULT false`).Error; err != nil {
				return err
			}
			// Backfill all existing properties to LEASE mode
			return db.Exec(
				`UPDATE properties SET modes = '{"LEASE"}' WHERE deleted_at IS NULL AND (modes IS NULL OR array_length(modes, 1) IS NULL)`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE properties DROP COLUMN IF EXISTS modes`).Error; err != nil {
				return err
			}
			return db.Exec(`ALTER TABLE properties DROP COLUMN IF EXISTS booking_requires_upfront_payment`).Error
		},
	}
}
