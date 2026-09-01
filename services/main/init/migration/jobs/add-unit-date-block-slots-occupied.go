package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddUnitDateBlockSlotsOccupied adds the column carrying how much of a unit a
// block holds. NULL is absolute — the whole unit.
//
// Nullable is required rather than stylistic: the table is populated, and a
// NOT NULL column without a default would fail on it. The rows already there
// are given their real scope by BackfillUnitDateBlocks, which runs next.
func AddUnitDateBlockSlotsOccupied() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608310001_ADD_UNIT_DATE_BLOCK_SLOTS_OCCUPIED",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(
				`ALTER TABLE unit_date_blocks ADD COLUMN IF NOT EXISTS slots_occupied BIGINT`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE unit_date_blocks DROP COLUMN IF EXISTS slots_occupied`).Error
		},
	}
}
