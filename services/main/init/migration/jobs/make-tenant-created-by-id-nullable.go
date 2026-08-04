package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// MakeTenantCreatedByIdNullable drops the NOT NULL constraint on tenants.created_by_id
// to allow tenants created via public guest-link bookings with no associated client user.
func MakeTenantCreatedByIdNullable() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202606040001_MAKE_TENANT_CREATED_BY_ID_NULLABLE",
		Migrate: func(db *gorm.DB) error {
			return db.Exec("ALTER TABLE tenants ALTER COLUMN created_by_id DROP NOT NULL").Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec("ALTER TABLE tenants ALTER COLUMN created_by_id SET NOT NULL").Error
		},
	}
}
