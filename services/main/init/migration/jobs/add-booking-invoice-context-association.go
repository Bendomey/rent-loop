package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddBookingInvoiceContextAssociation adds context_booking_id to invoices for booking-linked invoices and removes the old invoice_id from bookings.
func AddBookingInvoiceContextAssociation() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202606230001_ADD_BOOKING_INVOICE_CONTEXT_ASSOCIATION",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS context_booking_id UUID REFERENCES bookings(id)`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE bookings DROP COLUMN IF EXISTS invoice_id`).Error; err != nil {
				return err
			}
			return nil
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id)`).Error; err != nil {
				return err
			}
			return db.Exec(`ALTER TABLE invoices DROP COLUMN IF EXISTS context_booking_id`).Error
		},
	}
}
