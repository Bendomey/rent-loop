package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddCodeTenantApplication() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202601161741_ADD_CODE_TO_TENANT_APPLICATION",
		Migrate: func(db *gorm.DB) error {
			return CheckIfColumnExists(db, &models.TenantApplication{}, "Code")
		},
		Rollback: func(db *gorm.DB) error {
			return DropColumnIfExists(db, &models.TenantApplication{}, "Code")
		},
	}
}
