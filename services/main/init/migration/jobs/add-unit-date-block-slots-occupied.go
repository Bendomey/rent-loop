package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddUnitDateBlockSlotsOccupied adds the column carrying how much of a unit a
// block holds, and gives the rows already in the table the scope they meant.
//
// Nullable is required rather than stylistic: the table is populated, and a
// NOT NULL column without a default would fail on it.
//
// NULL means absolute — the whole unit — which is right for a manual
// MAINTENANCE/PERSONAL/OTHER block and wrong for every LEASE and BOOKING row
// written before this column existed. Left NULL, a single sitting tenant would
// saturate a four-bed room and the lease guard would refuse every subsequent
// tenancy in it. One tenancy holds one bed.
func AddUnitDateBlockSlotsOccupied() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608310001_ADD_UNIT_DATE_BLOCK_SLOTS_OCCUPIED",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(
				`ALTER TABLE unit_date_blocks ADD COLUMN IF NOT EXISTS slots_occupied BIGINT`,
			).Error; err != nil {
				return err
			}

			return db.Exec(`
				UPDATE unit_date_blocks
				SET slots_occupied = 1
				WHERE slots_occupied IS NULL
				  AND block_type IN ('LEASE', 'BOOKING')
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE unit_date_blocks DROP COLUMN IF EXISTS slots_occupied`).Error
		},
	}
}
