package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// BackfillSharedFinancialAccounts populates the new links from the old ones.
//
// The lease scoping keys off period_start, never created_at. After the v2
// backfill every charge instance carries created_at = the backfill date while
// real periods span 2018 to 2030, so row-creation time is a migration artifact
// and would attach charges to whichever term happened to be current on the day
// that backfill ran.
//
// Instances with no period, or whose period falls outside every term, keep a
// NULL lease_id. That is correct rather than a gap: a deposit taken before any
// term began belongs to the relationship, not to a contract.
//
// No amount is written anywhere in this job. Total outstanding is identical
// before and after.
func BackfillSharedFinancialAccounts() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608180002_BACKFILL_SHARED_FINANCIAL_ACCOUNTS",
		Migrate: func(db *gorm.DB) error {
			statements := []string{
				// 1. Leases point at accounts. Today's mapping is a clean 1:1
				//    through the column the drop job will remove.
				`UPDATE leases l
				 SET financial_account_id = fa.id
				 FROM financial_accounts fa
				 WHERE fa.lease_id = l.id
				   AND fa.deleted_at IS NULL
				   AND l.financial_account_id IS NULL`,

				// 2. Charge instances gain contractual context, matched by the
				//    period they cover against the term that contains it.
				`UPDATE charge_instances ci
				 SET lease_id = l.id
				 FROM leases l
				 WHERE l.financial_account_id = ci.financial_account_id
				   AND l.deleted_at IS NULL
				   AND ci.lease_id IS NULL
				   AND ci.period_start IS NOT NULL
				   AND ci.period_start >= l.move_in_date
				   AND (l.move_out_date IS NULL OR ci.period_start < l.move_out_date)`,

				// 3. Definitions, by the same rule on their start date.
				`UPDATE charge_definitions cd
				 SET lease_id = l.id
				 FROM leases l
				 WHERE l.financial_account_id = cd.financial_account_id
				   AND l.deleted_at IS NULL
				   AND cd.lease_id IS NULL
				   AND cd.start_date IS NOT NULL
				   AND cd.start_date >= l.move_in_date
				   AND (l.move_out_date IS NULL OR cd.start_date < l.move_out_date)`,

				// 4. Identity columns must be populated on every account —
				//    they now decide whether a new lease joins this
				//    relationship rather than opening a second one.
				`UPDATE financial_accounts fa
				 SET tenant_id = l.tenant_id
				 FROM leases l
				 WHERE l.financial_account_id = fa.id
				   AND l.deleted_at IS NULL
				   AND fa.tenant_id IS NULL`,

				`UPDATE financial_accounts fa
				 SET property_id = u.property_id
				 FROM leases l
				 JOIN units u ON u.id = l.unit_id
				 WHERE l.financial_account_id = fa.id
				   AND l.deleted_at IS NULL
				   AND fa.property_id IS NULL`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			// tenant_id and property_id are deliberately left populated: they
			// were nullable reporting columns before this change and filling
			// them is not something to undo.
			statements := []string{
				`UPDATE charge_definitions SET lease_id = NULL`,
				`UPDATE charge_instances SET lease_id = NULL`,
				`UPDATE leases SET financial_account_id = NULL`,
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
