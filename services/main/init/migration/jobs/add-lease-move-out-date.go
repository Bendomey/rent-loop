package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddLeaseMoveOutDate() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202607040001_ADD_LEASE_MOVE_OUT_DATE",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(
				`ALTER TABLE leases ADD COLUMN IF NOT EXISTS move_out_date TIMESTAMPTZ`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE leases DROP COLUMN IF EXISTS move_out_date`).Error
		},
	}
}
