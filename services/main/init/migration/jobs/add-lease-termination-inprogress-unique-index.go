package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddLeaseTerminationInProgressUniqueIndex() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202506120001_ADD_LEASE_TERMINATION_INPROGRESS_UNIQUE_INDEX",
		Migrate: func(db *gorm.DB) error {
			// Partial unique index: only one InProgress termination per lease at a time.
			// Covers soft-deleted rows by excluding them from the constraint.
			return db.Exec(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_lease_terminations_one_inprogress_per_lease
				ON lease_terminations (lease_id)
				WHERE status = 'LeaseTermination.Status.InProgress'
				  AND deleted_at IS NULL
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`DROP INDEX IF EXISTS idx_lease_terminations_one_inprogress_per_lease`).Error
		},
	}
}
