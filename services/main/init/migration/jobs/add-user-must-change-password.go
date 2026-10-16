package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddUserMustChangePassword() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202610160001_ADD_USER_MUST_CHANGE_PASSWORD",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(
				`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE users DROP COLUMN IF EXISTS must_change_password`).Error
		},
	}
}
