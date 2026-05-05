package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddUnitDateBlocksTable() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604230003_ADD_UNIT_DATE_BLOCKS_TABLE",
		Migrate: func(db *gorm.DB) error {
			// Composite index for availability range queries
			if err := db.Exec(`CREATE INDEX IF NOT EXISTS idx_unit_date_blocks_unit_dates ON unit_date_blocks (unit_id, start_date, end_date)`).Error; err != nil {
				return err
			}
			// Partial unique index to prevent duplicate lease blocks (enables ON CONFLICT DO NOTHING in backfill)
			return db.Exec(
				`CREATE UNIQUE INDEX IF NOT EXISTS idx_unit_date_blocks_unit_lease ON unit_date_blocks (unit_id, lease_id) WHERE lease_id IS NOT NULL AND deleted_at IS NULL`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`DROP INDEX IF EXISTS idx_unit_date_blocks_unit_dates`).Error; err != nil {
				return err
			}

			if err := db.Exec(`DROP INDEX IF EXISTS idx_unit_date_blocks_unit_lease`).Error; err != nil {
				return err
			}

			return nil
		},
	}
}
