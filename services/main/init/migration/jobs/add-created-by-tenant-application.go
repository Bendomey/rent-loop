package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddCreatedByTenantApplication() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202601051010_ADD_CREATED_BY_TENANT_APPLICATION",
		Migrate: func(db *gorm.DB) error {
			return CheckIfColumnExists(db, &models.TenantApplication{}, "CreatedById")
		},
		Rollback: func(db *gorm.DB) error {
			return DropColumnIfExists(db, &models.TenantApplication{}, "CreatedById")
		},
	}
}
