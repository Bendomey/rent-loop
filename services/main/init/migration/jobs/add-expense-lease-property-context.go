package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddExpenseLeasePropertyContext() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604010001_ADD_EXPENSE_LEASE_PROPERTY_CONTEXT",
		Migrate: func(db *gorm.DB) error {
			// 1. Add nullable columns first
			if err := db.Exec(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS context_lease_id UUID REFERENCES leases(id)`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id)`).Error; err != nil {
				return err
			}

			// 2. Create indexes
			if err := db.Exec(`CREATE INDEX IF NOT EXISTS idx_expenses_context_lease_id ON expenses(context_lease_id)`).Error; err != nil {
				return err
			}
			if err := db.Exec(`CREATE INDEX IF NOT EXISTS idx_expenses_property_id ON expenses(property_id)`).Error; err != nil {
				return err
			}

			// 3. Backfill property_id for existing maintenance expenses
			//    (join through maintenance request → unit → property)
			if err := db.Exec(`
				UPDATE expenses e
				SET property_id = u.property_id
				FROM maintenance_requests mr
				JOIN units u ON u.id = mr.unit_id
				WHERE e.context_maintenance_request_id = mr.id
				  AND e.property_id IS NULL
			`).Error; err != nil {
				return err
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`DROP INDEX IF EXISTS idx_expenses_context_lease_id`).Error; err != nil {
				return err
			}
			if err := db.Exec(`DROP INDEX IF EXISTS idx_expenses_property_id`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE expenses DROP COLUMN IF EXISTS context_lease_id`).Error; err != nil {
				return err
			}
			return db.Exec(`ALTER TABLE expenses DROP COLUMN IF EXISTS property_id`).Error
		},
	}
}
