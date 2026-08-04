package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddClientCurrency() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202606110001_ADD_CLIENT_CURRENCY",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(
				`ALTER TABLE clients ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'GHS'`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE clients DROP COLUMN IF EXISTS currency`).Error
		},
	}
}
