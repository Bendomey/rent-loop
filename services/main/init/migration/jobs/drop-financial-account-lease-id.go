package jobs

import (
	"errors"

	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// ErrSharedAccountMappingIncomplete stops the drop when any account's lease
// pointer did not make it onto the lease. Losing that mapping silently is the
// one outcome this job must never produce.
var ErrSharedAccountMappingIncomplete = errors.New(
	"financial_accounts.lease_id still holds mappings absent from leases.financial_account_id; " +
		"run BackfillSharedFinancialAccounts and verify before dropping",
)

// DropFinancialAccountLeaseID removes the column that made one-account-per-
// lease structural.
//
// DESTRUCTIVE. The unique index on financial_accounts.lease_id is what
// prevents a renewal from sharing its parent's account, so it cannot stay —
// but once dropped, the account -> lease mapping it held exists only in
// leases.financial_account_id. Run BackfillSharedFinancialAccounts first and
// verify it: the Rollback below restores structure only. The data is gone.
func DropFinancialAccountLeaseID() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608180004_DROP_FINANCIAL_ACCOUNT_LEASE_ID",
		Migrate: func(db *gorm.DB) error {
			var orphans int64
			countErr := db.Raw(`
				SELECT COUNT(*)
				FROM financial_accounts fa
				WHERE fa.deleted_at IS NULL
				  AND fa.lease_id IS NOT NULL
				  AND NOT EXISTS (
					SELECT 1 FROM leases l
					WHERE l.id = fa.lease_id
					  AND l.financial_account_id = fa.id
				  )
			`).Scan(&orphans).Error
			if countErr != nil {
				return countErr
			}

			if orphans > 0 {
				return ErrSharedAccountMappingIncomplete
			}

			statements := []string{
				`DROP INDEX IF EXISTS idx_financial_accounts_lease_id`,
				`ALTER TABLE financial_accounts DROP COLUMN IF EXISTS lease_id`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			// Structure only. The mapping is not restored — it lives on the
			// leases table now.
			return db.Exec(`ALTER TABLE financial_accounts ADD COLUMN IF NOT EXISTS lease_id UUID`).Error
		},
	}
}
