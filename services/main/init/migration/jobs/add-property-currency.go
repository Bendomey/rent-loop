package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddPropertyCurrency() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202606110002_ADD_PROPERTY_CURRENCY",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(
				`ALTER TABLE properties ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'GHS'`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE properties DROP COLUMN IF EXISTS currency`).Error
		},
	}
}
