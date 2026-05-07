package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddBookingStayFrequency() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202605070001_ADD_BOOKING_STAY_FREQUENCY",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stay_frequency TEXT NOT NULL DEFAULT ''`).Error; err != nil {
				return err
			}

			return db.Exec(`
				UPDATE bookings b
				SET stay_frequency = u.payment_frequency
				FROM units u
				WHERE b.unit_id::uuid = u.id
				  AND b.deleted_at IS NULL
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE bookings DROP COLUMN IF EXISTS stay_frequency`).Error
		},
	}
}
