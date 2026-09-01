package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddUnitDateBlockSlotsOccupied adds the column carrying how much of a unit a
// block holds, and gives the rows already in the table the scope they meant.
func AddUnitDateBlockSlotsOccupied() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608310001_ADD_UNIT_DATE_BLOCK_SLOTS_OCCUPIED",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(
				`ALTER TABLE unit_date_blocks ADD COLUMN IF NOT EXISTS slots_occupied BIGINT`,
			).Error;
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE unit_date_blocks DROP COLUMN IF EXISTS slots_occupied`).Error
		},
	}
}
