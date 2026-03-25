package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddClientCompanyFields adds description and registration_number columns to clients.
func AddClientCompanyFields() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202603250001_ADD_CLIENT_COMPANY_FIELDS",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS description TEXT`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS registration_number TEXT`).Error; err != nil {
				return err
			}
			return nil
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE clients DROP COLUMN IF EXISTS registration_number`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE clients DROP COLUMN IF EXISTS description`).Error; err != nil {
				return err
			}
			return nil
		},
	}
}
