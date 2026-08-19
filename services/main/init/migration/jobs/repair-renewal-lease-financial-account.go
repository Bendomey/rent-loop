package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// RepairRenewalLeaseFinancialAccount gives lease 2608NHQ8DS the financial
// account it never had.
//
// That lease is the one renewal created in production before the feature
// existed, by hand-written SQL against the pre-account model. Its money — a
// year of rent paid in advance, 660,000 pesewas at 55,000 a month — sat in
// legacy leases.meta under `initial_deposit_fee`, which in this system means
// advance rent and never a deposit. With no account it was invisible to the
// issuance sweep.
//
// The repair joins it to its PARENT's account rather than opening a new one,
// which is the whole point of the shared-account model: a renewal continues a
// financial relationship, it does not start one.
//
// Money already received is recorded as a real Payment with allocations, never
// as a direct write to settled_amount. settled_amount is derived from
// allocations everywhere else (see scripts/verify-financial-invariants.sql,
// invariant 3), and a settled charge with nothing behind it is exactly the
// desync that makes a ledger untrustworthy.
//
// Every statement is guarded so a re-run is a no-op.
func RepairRenewalLeaseFinancialAccount() *gormigrate.Migration {
	const leaseCode = "2608NHQ8DS"

	return &gormigrate.Migration{
		ID: "202608180003_REPAIR_RENEWAL_LEASE_FINANCIAL_ACCOUNT",
		Migrate: func(db *gorm.DB) error {
			statements := []string{
				// 1. Join the renewal to its parent's account.
				`UPDATE leases l
				 SET financial_account_id = fa.id
				 FROM leases parent
				 JOIN financial_accounts fa ON fa.lease_id = parent.id AND fa.deleted_at IS NULL
				 WHERE l.code = '` + leaseCode + `'
				   AND parent.id = l.parent_lease_id
				   AND l.financial_account_id IS NULL`,

				// 2. One rent charge per month of the renewal term, scoped to
				//    the renewal lease. Amounts come off the lease itself.
				`INSERT INTO charge_instances (
					financial_account_id, lease_id, name, category, amount, currency,
					period_start, period_end, due_date, invoiced_amount, settled_amount
				 )
				 SELECT l.financial_account_id, l.id,
				        'Rent – ' || to_char(gs, 'FMMonth YYYY'),
				        'RENT', l.rent_fee, l.rent_fee_currency,
				        gs, gs + INTERVAL '1 month' - INTERVAL '1 day', gs, 0, 0
				 FROM leases l,
				      LATERAL generate_series(
				        l.move_in_date, l.move_out_date - INTERVAL '1 day', INTERVAL '1 month'
				      ) gs
				 WHERE l.code = '` + leaseCode + `'
				   AND l.financial_account_id IS NOT NULL
				   AND NOT EXISTS (
				     SELECT 1 FROM charge_instances ci WHERE ci.lease_id = l.id
				   )`,

				// 3. The invoice the prepayment settled.
				`INSERT INTO invoices (
					code, payer_type, payer_lease_id, payee_type, payee_client_id,
					context_type, total_amount, taxes, sub_total, currency, status,
					issued_at, paid_at, due_date, allowed_payment_rails, reminders_sent,
					financial_account_id, property_id, client_id
				 )
				 SELECT 'INV-2608-GGRNW1', 'TENANT', l.id, 'PROPERTY_OWNER', fa.client_id,
				        'LEASE_RENT',
				        (SELECT COALESCE(SUM(amount), 0) FROM charge_instances WHERE lease_id = l.id),
				        0,
				        (SELECT COALESCE(SUM(amount), 0) FROM charge_instances WHERE lease_id = l.id),
				        l.rent_fee_currency, 'PAID',
				        l.move_in_date, l.move_in_date, l.move_in_date,
				        '{OFFLINE}', '{}',
				        fa.id, fa.property_id, fa.client_id
				 FROM leases l
				 JOIN financial_accounts fa ON fa.id = l.financial_account_id
				 WHERE l.code = '` + leaseCode + `'
				   AND NOT EXISTS (SELECT 1 FROM invoices WHERE code = 'INV-2608-GGRNW1')`,

				// 4. A line item per charge. Invariant 5 requires every
				//    account-backed line to claim one.
				`INSERT INTO invoice_line_items (
					invoice_id, label, category, quantity, unit_amount, total_amount,
					currency, charge_instance_id
				 )
				 SELECT i.id, ci.name, ci.category, 1, ci.amount, ci.amount, ci.currency, ci.id
				 FROM invoices i
				 JOIN leases l ON l.id = i.payer_lease_id
				 JOIN charge_instances ci ON ci.lease_id = l.id
				 WHERE i.code = 'INV-2608-GGRNW1'
				   AND NOT EXISTS (
				     SELECT 1 FROM invoice_line_items li WHERE li.invoice_id = i.id
				   )`,

				// 5. The money itself. Marked so it is never mistaken for a
				//    payment this system collected.
				`INSERT INTO payments (
					invoice_id, rail, provider, amount, currency, reference, status,
					successful_at, metadata
				 )
				 SELECT i.id, 'OFFLINE', 'CASH', i.total_amount, i.currency,
				        'MIGRATION-` + leaseCode + `', 'SUCCESSFUL', i.paid_at,
				        '{"source":"pre-system prepayment migrated from leases.meta.initial_deposit_fee"}'::jsonb
				 FROM invoices i
				 WHERE i.code = 'INV-2608-GGRNW1'
				   AND NOT EXISTS (
				     SELECT 1 FROM payments WHERE reference = 'MIGRATION-` + leaseCode + `'
				   )`,

				// 6. Allocate it across the charges it covers.
				`INSERT INTO payment_allocations (
					payment_id, charge_instance_id, invoice_line_item_id, amount, currency
				 )
				 SELECT p.id, li.charge_instance_id, li.id, li.total_amount, li.currency
				 FROM payments p
				 JOIN invoice_line_items li ON li.invoice_id = p.invoice_id
				 WHERE p.reference = 'MIGRATION-` + leaseCode + `'
				   AND NOT EXISTS (
				     SELECT 1 FROM payment_allocations pa WHERE pa.payment_id = p.id
				   )`,

				// 7. Roll the derived amounts up onto the charges, FROM the
				//    allocations — never independently of them.
				`UPDATE charge_instances ci
				 SET invoiced_amount = sums.invoiced,
				     settled_amount  = sums.settled
				 FROM (
				   SELECT li.charge_instance_id AS id,
				          SUM(li.total_amount) AS invoiced,
				          SUM(COALESCE(pa.amount, 0)) AS settled
				   FROM invoice_line_items li
				   JOIN invoices i ON i.id = li.invoice_id
				   LEFT JOIN payment_allocations pa ON pa.invoice_line_item_id = li.id
				   WHERE i.code = 'INV-2608-GGRNW1'
				   GROUP BY li.charge_instance_id
				 ) sums
				 WHERE ci.id = sums.id`,
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
				`DELETE FROM payment_allocations WHERE payment_id IN (
					SELECT id FROM payments WHERE reference = 'MIGRATION-` + leaseCode + `')`,
				`DELETE FROM payments WHERE reference = 'MIGRATION-` + leaseCode + `'`,
				`DELETE FROM invoice_line_items WHERE invoice_id IN (
					SELECT id FROM invoices WHERE code = 'INV-2608-GGRNW1')`,
				`DELETE FROM invoices WHERE code = 'INV-2608-GGRNW1'`,
				`DELETE FROM charge_instances WHERE lease_id IN (
					SELECT id FROM leases WHERE code = '` + leaseCode + `')`,
				`UPDATE leases SET financial_account_id = NULL WHERE code = '` + leaseCode + `'`,
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
