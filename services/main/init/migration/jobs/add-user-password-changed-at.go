package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddUserPasswordChangedAt() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202610170001_ADD_USER_PASSWORD_CHANGED_AT",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at timestamptz`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE users DROP COLUMN IF EXISTS password_changed_at`).Error
		},
	}
}
