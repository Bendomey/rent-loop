package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddUserPasswordChangedAt() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202610170001_ADD_USER_PASSWORD_CHANGED_AT",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at timestamptz`).Error; err != nil {
				return err
			}
			// Users that predate this column are trusted with their current password;
			// only accounts created from here on are prompted to replace the generated one.
			return db.Exec(`UPDATE users SET password_changed_at = NOW() WHERE password_changed_at IS NULL`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE users DROP COLUMN IF EXISTS password_changed_at`).Error
		},
	}
}
