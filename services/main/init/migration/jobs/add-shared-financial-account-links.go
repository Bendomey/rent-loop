package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddSharedFinancialAccountLinks makes one financial account able to span many
// leases.
//
// The account's tenant_application_id column is deliberately NOT renamed. The
// Go field became OriginTenantApplicationID, mapped with a column tag: this
// repo runs AutoMigrate before the job list, so any rename job would run only
// after AutoMigrate had already failed trying to add the new column NOT NULL
// to a populated table.
//
// Structure only: financial_accounts.lease_id and its unique index survive
// this job so BackfillSharedFinancialAccounts has a source to read, and so a
// rollback costs nothing. DropFinancialAccountLeaseID removes them later,
// behind an explicit opt-in.
//
// NOTE on uuid_generate_v4(): on Supabase the uuid-ossp extension lives in the
// `extensions` schema, not `public`, so this job fails with "function
// uuid_generate_v4() does not exist" unless the database's search_path
// includes it:
//
//	ALTER DATABASE <db> SET search_path TO public, extensions;
func AddSharedFinancialAccountLinks() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608180001_ADD_SHARED_FINANCIAL_ACCOUNT_LINKS",
		Migrate: func(db *gorm.DB) error {
			statements := []string{
				`ALTER TABLE leases ADD COLUMN IF NOT EXISTS financial_account_id UUID REFERENCES financial_accounts(id)`,
				`CREATE INDEX IF NOT EXISTS idx_leases_financial_account_id ON leases(financial_account_id)`,

				`ALTER TABLE charge_definitions ADD COLUMN IF NOT EXISTS lease_id UUID REFERENCES leases(id)`,
				`CREATE INDEX IF NOT EXISTS idx_charge_definitions_lease_id ON charge_definitions(lease_id)`,

				`ALTER TABLE charge_instances ADD COLUMN IF NOT EXISTS lease_id UUID REFERENCES leases(id)`,
				`CREATE INDEX IF NOT EXISTS idx_charge_instances_lease_id ON charge_instances(lease_id)`,

				`ALTER TABLE financial_accounts ADD COLUMN IF NOT EXISTS closure_eligible_at TIMESTAMPTZ`,

				`CREATE TABLE IF NOT EXISTS financial_account_closures (
					id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
					created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMPTZ,
					financial_account_id UUID NOT NULL REFERENCES financial_accounts(id),
					reason TEXT NOT NULL,
					closed_at TIMESTAMPTZ NOT NULL,
					closed_by_id UUID NOT NULL,
					outstanding_at_closure BIGINT NOT NULL DEFAULT 0,
					deposit_held_amount BIGINT NOT NULL DEFAULT 0,
					deposit_refund_charge_instance_id UUID,
					deposit_forfeited_amount BIGINT NOT NULL DEFAULT 0,
					reopened_at TIMESTAMPTZ,
					reopened_by_id UUID,
					reopen_reason TEXT
				)`,
				`CREATE INDEX IF NOT EXISTS idx_financial_account_closures_account
					ON financial_account_closures(financial_account_id)`,
				`CREATE INDEX IF NOT EXISTS idx_financial_account_closures_deleted_at
					ON financial_account_closures(deleted_at)`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			statements := []string{
				`DROP TABLE IF EXISTS financial_account_closures`,
				`ALTER TABLE financial_accounts DROP COLUMN IF EXISTS closure_eligible_at`,
				`ALTER TABLE charge_instances DROP COLUMN IF EXISTS lease_id`,
				`ALTER TABLE charge_definitions DROP COLUMN IF EXISTS lease_id`,
				`ALTER TABLE leases DROP COLUMN IF EXISTS financial_account_id`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			return nil
		},
	}
}
