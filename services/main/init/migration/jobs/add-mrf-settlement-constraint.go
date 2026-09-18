package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddMRFSettlementConstraint pairs settlement_type with its link. The Go type
// cannot say "exactly one of these, matching the discriminator", so the
// database says it instead.
func AddMRFSettlementConstraint() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202609100002_ADD_MRF_SETTLEMENT_CONSTRAINT",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`
				ALTER TABLE maintenance_request_financials
				DROP CONSTRAINT IF EXISTS chk_mrf_settlement_link
			`).Error; err != nil {
				return err
			}
			return db.Exec(`
				ALTER TABLE maintenance_request_financials
				ADD CONSTRAINT chk_mrf_settlement_link CHECK (
				  (settlement_type = 'RECORD_ONLY'
				     AND charge_instance_id IS NULL AND expense_id IS NULL) OR
				  (settlement_type = 'TENANT_CHARGE'
				     AND charge_instance_id IS NOT NULL AND expense_id IS NULL) OR
				  (settlement_type = 'VENDOR_EXPENSE'
				     AND expense_id IS NOT NULL AND charge_instance_id IS NULL)
				)
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`
				ALTER TABLE maintenance_request_financials
				DROP CONSTRAINT IF EXISTS chk_mrf_settlement_link
			`).Error
		},
	}
}
