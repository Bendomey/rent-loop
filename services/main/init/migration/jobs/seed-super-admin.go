package jobs

import (
	"os"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// SeedSuperAdmin creates a super admin with default credentials.
// Note: Change the password after the first login for security reasons.
func SeedSuperAdmin() *gormigrate.Migration {
	superAdmin := models.Admin{
		Name:     os.Getenv("SUPER_ADMIN_NAME"),
		Email:    os.Getenv("SUPER_ADMIN_EMAIL"),
		Password: os.Getenv("SUPER_ADMIN_PASSWORD"),
	}

	return &gormigrate.Migration{
		ID: "SUPER_ADMIN",
		Migrate: func(db *gorm.DB) error {
			return db.Create(&superAdmin).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Delete(&superAdmin).Error
		},
	}
}
