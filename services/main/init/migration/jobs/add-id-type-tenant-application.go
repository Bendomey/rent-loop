package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddIDTypeTenantApplication() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202601220748_ADD_ID_TYPE_TO_TENANT_APPLICATION",
		Migrate: func(db *gorm.DB) error {
			return CheckIfColumnExists(db, &models.TenantApplication{}, "IDType")
		},
		Rollback: func(db *gorm.DB) error {
			return DropColumnIfExists(db, &models.TenantApplication{}, "IDType")
		},
	}
}
