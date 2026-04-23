package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddUnitDateBlocksTable() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604230003_ADD_UNIT_DATE_BLOCKS_TABLE",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				CREATE TABLE IF NOT EXISTS unit_date_blocks (
					id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
					created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMPTZ,
					unit_id UUID NOT NULL REFERENCES units(id),
					start_date DATE NOT NULL,
					end_date DATE NOT NULL,
					block_type VARCHAR NOT NULL,
					booking_id UUID REFERENCES bookings(id),
					lease_id UUID REFERENCES leases(id),
					reason TEXT NOT NULL DEFAULT '',
					created_by_client_user_id UUID REFERENCES client_users(id)
				)
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`DROP TABLE IF EXISTS unit_date_blocks`).Error
		},
	}
}
