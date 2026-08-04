package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddClientLogoURL adds the logo_url column to clients.
func AddClientLogoURL() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608030001_ADD_CLIENT_LOGO_URL",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS logo_url TEXT`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE clients DROP COLUMN IF EXISTS logo_url`).Error
		},
	}
}
