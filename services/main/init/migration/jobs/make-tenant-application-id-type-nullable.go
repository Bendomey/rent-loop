package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// MakeTenantApplicationIDTypeNullable drops the NOT NULL constraint on id_type,
// which was missed in the earlier MakeTenantApplicationFieldsNullable migration.
// Bulk/partial applications (CSV upload) may not have id_type set.
func MakeTenantApplicationIDTypeNullable() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604190001_MAKE_TENANT_APPLICATION_ID_TYPE_NULLABLE",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(
				"ALTER TABLE tenant_applications ALTER COLUMN id_type DROP NOT NULL",
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(
				"ALTER TABLE tenant_applications ALTER COLUMN id_type SET NOT NULL",
			).Error
		},
	}
}
