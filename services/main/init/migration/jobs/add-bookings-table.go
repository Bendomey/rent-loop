package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddBookingsTable() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604230002_ADD_BOOKINGS_TABLE",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				CREATE TABLE IF NOT EXISTS bookings (
					id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
					created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMPTZ,
					code VARCHAR NOT NULL UNIQUE,
					tracking_code VARCHAR NOT NULL UNIQUE,
					check_in_code VARCHAR NOT NULL DEFAULT '',
					unit_id UUID NOT NULL REFERENCES units(id),
					property_id UUID NOT NULL REFERENCES properties(id),
					tenant_id UUID NOT NULL REFERENCES tenants(id),
					check_in_date DATE NOT NULL,
					check_out_date DATE NOT NULL,
					rate BIGINT NOT NULL,
					currency VARCHAR NOT NULL,
					status VARCHAR NOT NULL DEFAULT 'PENDING',
					cancellation_reason TEXT NOT NULL DEFAULT '',
					notes TEXT NOT NULL DEFAULT '',
					booking_source VARCHAR NOT NULL,
					requires_upfront_payment BOOLEAN NOT NULL DEFAULT false,
					created_by_client_user_id UUID REFERENCES client_users(id),
					invoice_id UUID REFERENCES invoices(id),
					meta JSONB
				)
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`DROP TABLE IF EXISTS bookings`).Error
		},
	}
}
