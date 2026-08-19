package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// NullableClosureClosedBy lets the closure sweep record a closure nobody
// performed.
//
// AutoMigrate runs before this job list and does not drop an existing NOT NULL
// when a model field becomes a pointer — it leaves the constraint in place
// rather than failing — so the change has to be made explicitly here.
func NullableClosureClosedBy() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608190002_NULLABLE_CLOSURE_CLOSED_BY",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(
				`ALTER TABLE financial_account_closures ALTER COLUMN closed_by_id DROP NOT NULL`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(
				`ALTER TABLE financial_account_closures ALTER COLUMN closed_by_id SET NOT NULL`,
			).Error
		},
	}
}
