package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddLeaseType records whether a lease began a tenancy or continued one.
//
// The backfill reads parent_lease_id, which is the only evidence available:
// any lease with a parent is a renewal, everything else is an original. On
// production at the time of writing that is exactly one row — lease
// 2608NHQ8DS, the renewal created by hand before the feature existed.
func AddLeaseType() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608190001_ADD_LEASE_TYPE",
		Migrate: func(db *gorm.DB) error {
			statements := []string{
				`ALTER TABLE leases ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'ORIGINAL'`,
				`CREATE INDEX IF NOT EXISTS idx_leases_type ON leases(type)`,
				`UPDATE leases SET type = 'RENEWAL'
				 WHERE parent_lease_id IS NOT NULL AND type = 'ORIGINAL'`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE leases DROP COLUMN IF EXISTS type`).Error
		},
	}
}
