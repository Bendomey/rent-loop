package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddMoveInUpdatesToLease() *gormigrate.Migration {
	newFields := []string{
		"KeyHandoverDate",
		"UtilityTransfersDate",
		"PropertyInspectionDate",
		"LeaseAggreementDocumentMode",
	}

	return &gormigrate.Migration{
		ID: "2026-01-16T11:43:05.316Z",
		Migrate: func(db *gorm.DB) error {
			for _, field := range newFields {
				addFieldErr := CheckIfColumnExists(db, &models.Lease{}, field)
				if addFieldErr != nil {
					return addFieldErr
				}
			}
			return nil
		},
		Rollback: func(db *gorm.DB) error {
			for _, field := range newFields {
				removeFieldErr := DropColumnIfExists(db, &models.Lease{}, field)
				if removeFieldErr != nil {
					return removeFieldErr
				}
			}

			return nil
		},
	}
}
