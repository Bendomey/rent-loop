package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddTenantApplicationPropertyId adds property_id to tenant_applications and backfills
// from the units table using the existing desired_unit_id.
func AddTenantApplicationPropertyId() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604200002_ADD_TENANT_APPLICATION_PROPERTY_ID",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE tenant_applications ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id)`).Error; err != nil {
				return err
			}

			if err := db.Exec(`
				UPDATE tenant_applications
				SET property_id = units.property_id
				FROM units
				WHERE tenant_applications.desired_unit_id = units.id
				  AND tenant_applications.property_id IS NULL
			`).Error; err != nil {
				return err
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE tenant_applications DROP COLUMN IF EXISTS property_id`).Error
		},
	}
}
