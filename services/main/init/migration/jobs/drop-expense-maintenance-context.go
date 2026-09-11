package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// DropExpenseMaintenanceContext removes the second source of truth. After
// BackfillMaintenanceRequestFinancials the line owns the link, and two places
// recording the same relationship is how they come to disagree.
func DropExpenseMaintenanceContext() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202609100005_DROP_EXPENSE_MAINTENANCE_CONTEXT",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				ALTER TABLE expenses DROP COLUMN IF EXISTS context_maintenance_request_id
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`
				ALTER TABLE expenses
				ADD COLUMN IF NOT EXISTS context_maintenance_request_id UUID
					REFERENCES maintenance_requests(id)
			`).Error
		},
	}
}
