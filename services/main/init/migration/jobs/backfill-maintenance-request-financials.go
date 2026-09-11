package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// BackfillMaintenanceRequestFinancials gives every legacy maintenance expense
// the line it never had. Those rows were always landlord-to-vendor costs; the
// old model simply had nowhere to record what they belonged to beyond a
// foreign key that is about to be dropped.
func BackfillMaintenanceRequestFinancials() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202609100003_BACKFILL_MAINTENANCE_REQUEST_FINANCIALS",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				INSERT INTO maintenance_request_financials (
					id, created_at, updated_at,
					maintenance_request_id, property_id,
					description, amount, currency,
					settlement_type, expense_id,
					created_by_client_user_id
				)
				SELECT
					uuid_generate_v4(), e.created_at, e.updated_at,
					e.context_maintenance_request_id, e.property_id,
					e.description, e.amount, e.currency,
					'VENDOR_EXPENSE', e.id,
					e.created_by_client_user_id
				FROM expenses e
				WHERE e.deleted_at IS NULL
				  AND e.context_maintenance_request_id IS NOT NULL
				  AND NOT EXISTS (
					SELECT 1 FROM maintenance_request_financials f
					WHERE f.expense_id = e.id AND f.deleted_at IS NULL
				  )
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`
				DELETE FROM maintenance_request_financials
				WHERE settlement_type = 'VENDOR_EXPENSE'
			`).Error
		},
	}
}
