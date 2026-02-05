package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddStatusTimestampsLease() *gormigrate.Migration {
	statusTimestamps := []string{"ActivatedAt", "CancelledAt", "CompletedAt", "TerminatedAt"}

	return &gormigrate.Migration{
		ID: "202602051141_ADD_STATUS_TIMESTAMPS_TO_LEASES",
		Migrate: func(db *gorm.DB) error {
			for _, field := range statusTimestamps {
				fieldErr := CheckIfColumnExists(db, &models.Lease{}, field)
				if fieldErr != nil {
					return fieldErr
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			for _, field := range statusTimestamps {
				fieldErr := DropColumnIfExists(db, &models.Lease{}, field)
				if fieldErr != nil {
					return fieldErr
				}
			}

			return nil
		},
	}
}
