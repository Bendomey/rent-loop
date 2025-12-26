package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddClientContactInfo() *gormigrate.Migration {
	newFields := []string{"WebsiteUrl", "SupportPhone", "SupportEmail"}

	return &gormigrate.Migration{
		ID: "202512261025_ADD_CLIENT_CONTACT_INFO",
		Migrate: func(db *gorm.DB) error {
			for _, field := range newFields {
				addFieldErr := CheckIfColumnExists(db, &models.Client{}, field)
				if addFieldErr != nil {
					return addFieldErr
				}
			}
			return nil
		},
		Rollback: func(db *gorm.DB) error {
			for _, field := range newFields {
				removeFieldErr := DropColumnIfExists(db, &models.Client{}, field)
				if removeFieldErr != nil {
					return removeFieldErr
				}
			}

			return nil
		},
	}
}
