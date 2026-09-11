package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// ReportLegacyExpenseShape counts the expense rows this migration is about to
// reshape, before anything mutates. The LEASE-context rows in particular are a
// judgement call, and the count is what makes it an informed one.
//
// context_lease_id is probed rather than assumed: a database initialised
// through InitSchema has every job marked applied without any of them having
// run, so the column AddExpenseLeasePropertyContext adds may not be there.
func ReportLegacyExpenseShape() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202609100001_REPORT_LEGACY_EXPENSE_SHAPE",
		Migrate: func(db *gorm.DB) error {
			var hasLeaseColumn int64
			if err := db.Raw(`
				SELECT COUNT(*) FROM information_schema.columns
				WHERE table_name = 'expenses' AND column_name = 'context_lease_id'
			`).Scan(&hasLeaseColumn).Error; err != nil {
				return err
			}

			leaseBranch := "'orphaned'"
			if hasLeaseColumn > 0 {
				leaseBranch = "CASE WHEN context_lease_id IS NOT NULL THEN 'lease_context_only' ELSE 'orphaned' END"
			}

			type row struct {
				Bucket string
				Total  int64
			}
			var rows []row
			if err := db.Raw(`
				SELECT
					CASE
						WHEN context_maintenance_request_id IS NOT NULL THEN 'has_maintenance_request'
						ELSE ` + leaseBranch + `
					END AS bucket,
					COUNT(*) AS total
				FROM expenses
				WHERE deleted_at IS NULL
				GROUP BY 1
			`).Scan(&rows).Error; err != nil {
				return err
			}

			for _, r := range rows {
				log.WithFields(log.Fields{"bucket": r.Bucket, "count": r.Total}).
					Info("[Migration.ReportLegacyExpenseShape] legacy expense census")
			}
			return nil
		},
		Rollback: func(db *gorm.DB) error { return nil },
	}
}
