package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddUserProfilePhotoUrl adds the profile_photo_url column to users.
func AddUserProfilePhotoUrl() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608060001_ADD_USER_PROFILE_PHOTO_URL",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE users DROP COLUMN IF EXISTS profile_photo_url`).Error
		},
	}
}
