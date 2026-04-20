package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddClientIdentityFields adds individual identity columns to clients.
func AddClientIdentityFields() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604200001_ADD_CLIENT_IDENTITY_FIELDS",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS id_type TEXT`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS id_number TEXT`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS id_expiry TEXT`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS id_document_url TEXT`).Error; err != nil {
				return err
			}
			return nil
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE clients DROP COLUMN IF EXISTS id_document_url`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE clients DROP COLUMN IF EXISTS id_expiry`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE clients DROP COLUMN IF EXISTS id_number`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE clients DROP COLUMN IF EXISTS id_type`).Error; err != nil {
				return err
			}
			return nil
		},
	}
}
