package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddFinancialAccountTables is Job 1 of the financial account migration: it is
// purely additive. Nothing is dropped here — the destructive changes live in
// DropLegacyFinancialColumns and run only after the backfill has verified
// clean against a production dump.
func AddFinancialAccountTables() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608050001_ADD_FINANCIAL_ACCOUNT_TABLES",
		Migrate: func(db *gorm.DB) error {
			if err := db.AutoMigrate(
				&models.FinancialAccount{},
				&models.ChargeDefinition{},
				&models.ChargeInstance{},
				&models.PaymentAllocation{},
			); err != nil {
				return err
			}

			if err := db.Exec(
				`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS financial_account_id UUID`,
			).Error; err != nil {
				return err
			}
			if err := db.Exec(
				`CREATE INDEX IF NOT EXISTS idx_invoices_financial_account_id
				 ON invoices(financial_account_id)`,
			).Error; err != nil {
				return err
			}

			if err := db.Exec(
				`ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS charge_instance_id UUID`,
			).Error; err != nil {
				return err
			}
			return db.Exec(
				`CREATE INDEX IF NOT EXISTS idx_invoice_line_items_charge_instance_id
				 ON invoice_line_items(charge_instance_id)`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(
				`ALTER TABLE invoice_line_items DROP COLUMN IF EXISTS charge_instance_id`,
			).Error; err != nil {
				return err
			}
			if err := db.Exec(
				`ALTER TABLE invoices DROP COLUMN IF EXISTS financial_account_id`,
			).Error; err != nil {
				return err
			}
			return db.Migrator().DropTable(
				&models.PaymentAllocation{},
				&models.ChargeInstance{},
				&models.ChargeDefinition{},
				&models.FinancialAccount{},
			)
		},
	}
}
