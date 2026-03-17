package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddLeaseNextBillingDate() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202603170001_ADD_LEASE_NEXT_BILLING_DATE",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE leases ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE leases DROP COLUMN IF EXISTS next_billing_date`).Error
		},
	}
}
