package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddDocsSetupFieldsToTenantApplication() *gormigrate.Migration {
	newFields := []string{
		"LeaseAggreementDocumentMode",
		"LeaseAgreementDocumentUrl",
		"LeaseAgreementDocumentPropertyManagerSignedById",
		"LeaseAgreementDocumentPropertyManagerSignedAt",
		"LeaseAgreementDocumentTenantSignedAt",
	}

	return &gormigrate.Migration{
		ID: "2026-01-16T11:48:59.703Z",
		Migrate: func(db *gorm.DB) error {
			for _, field := range newFields {
				addFieldErr := CheckIfColumnExists(db, &models.TenantApplication{}, field)
				if addFieldErr != nil {
					return addFieldErr
				}
			}
			return nil
		},
		Rollback: func(db *gorm.DB) error {
			for _, field := range newFields {
				removeFieldErr := DropColumnIfExists(db, &models.TenantApplication{}, field)
				if removeFieldErr != nil {
					return removeFieldErr
				}
			}

			return nil
		},
	}
}
