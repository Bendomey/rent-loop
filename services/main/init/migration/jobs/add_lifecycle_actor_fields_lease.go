package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddLifecycleActorFieldsLease() *gormigrate.Migration {
	fields := []string{"ActivatedById", "CancelledById", "CompletedById", "TerminatedById"}

	return &gormigrate.Migration{
		ID: "202602122026_ADD_LIFECYCLE_ACTOR_FIELDS_LEASE",
		Migrate: func(db *gorm.DB) error {
			for _, field := range fields {
				newFieldErr := CheckIfColumnExists(db, &models.Lease{}, field)
				if newFieldErr != nil {
					return newFieldErr
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			for _, field := range fields {
				removedFieldErr := DropColumnIfExists(db, &models.Lease{}, field)
				if removedFieldErr != nil {
					return removedFieldErr
				}
			}
			return nil
		},
	}
}
