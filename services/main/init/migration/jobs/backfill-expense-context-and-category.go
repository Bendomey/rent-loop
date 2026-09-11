package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// BackfillExpenseContextAndCategory settles what the reshaped columns hold for
// rows that predate them.
//
// Legacy rows get no invoice and no new journal entry. They already posted
// Dr Maintenance Expense / Cr Cash when they were created — the money had
// left — and DeriveExpenseStatus reads an invoice-less expense as SETTLED for
// exactly that reason. Marking them outstanding would tell the landlord they
// owe vendors for cash already spent.
//
// LEASE-context rows carried a lease but no request and were the old "bill the
// tenant" path. They become GENERAL expenses with the lease code kept in the
// description, because no column survives to hold it. Fabricating charge
// instances for them would create real retroactive obligations on tenant
// accounts.
func BackfillExpenseContextAndCategory() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202609100004_BACKFILL_EXPENSE_CONTEXT_AND_CATEGORY",
		Migrate: func(db *gorm.DB) error {
			// AutoMigrate has already defaulted every pre-existing row to
			// OTHER. This job runs once, immediately after, so every row it
			// sees is legacy and keying off the request link cannot clobber a
			// category a landlord deliberately chose.
			if err := db.Exec(`
				UPDATE expenses SET category = 'REPAIRS'
				WHERE deleted_at IS NULL
				  AND context_maintenance_request_id IS NOT NULL
			`).Error; err != nil {
				return err
			}

			var hasLeaseColumn int64
			if err := db.Raw(`
				SELECT COUNT(*) FROM information_schema.columns
				WHERE table_name = 'expenses' AND column_name = 'context_lease_id'
			`).Scan(&hasLeaseColumn).Error; err != nil {
				return err
			}

			if hasLeaseColumn > 0 {
				if err := db.Exec(`
					UPDATE expenses e
					SET description = e.description ||
						' (originally recorded against lease ' || l.code || ')'
					FROM leases l
					WHERE l.id = e.context_lease_id
					  AND e.deleted_at IS NULL
					  AND e.context_lease_id IS NOT NULL
					  AND e.description NOT LIKE '%originally recorded against lease%'
				`).Error; err != nil {
					return err
				}
			}

			return db.Exec(`
				UPDATE expenses
				SET context_type = CASE
					WHEN context_maintenance_request_id IS NOT NULL THEN 'MAINTENANCE'
					ELSE 'GENERAL'
				END
				WHERE deleted_at IS NULL
			`).Error
		},
		Rollback: func(db *gorm.DB) error { return nil },
	}
}
