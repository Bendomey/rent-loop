package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddEmployerTypeTenantApplications() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202602161242_ADD_EMPLOYER_TYPE_TENANT_APPLICATIONS",
		Migrate: func(db *gorm.DB) error {
			addErr := CheckIfColumnExists(db, &models.TenantApplication{}, "EmployerType")
			if addErr != nil {
				return addErr
			}
			return nil
		},
		Rollback: func(db *gorm.DB) error {
			removeErr := DropColumnIfExists(db, &models.TenantApplication{}, "EmployerType")
			if removeErr != nil {
				return removeErr
			}
			return nil
		},
	}
}
