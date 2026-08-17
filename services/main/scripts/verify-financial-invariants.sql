-- Data-integrity check for the tenant financial ledger.
--
-- Every query below MUST return zero rows. These are not migration checks —
-- they are invariants of the live system. If any of them ever returns rows,
-- the ledger has drifted and something in the allocation engine is wrong.
--
--   psql "$DB_NAME" -f scripts/verify-financial-invariants.sql
--
-- Safe to run against production at any time: read-only, SELECT statements
-- only, no transaction.
--
-- History: this file began as verify-financial-backfill.sql, the gate on the
-- FinancialAccount migration. The migration-specific queries were removed once
-- that migration had run everywhere. Two of them are worth naming, so nobody
-- reintroduces them:
--
--   * "every expense-derived invoice can still derive a property" and "no
--     invoice would lose its lease/application link" read invoices.context_*
--     columns that DropLegacyFinancialColumns has since dropped.
--   * "every application with rent terms has exactly one account" is no longer
--     true by design. A renewal reuses its parent's application, so one
--     application legitimately carries one account per lease — which is why
--     FinancialAccount.TenantApplicationID is indexed but not unique.

\echo '=== 1. No charge invoiced beyond its amount ==='
SELECT id, name, amount, invoiced_amount
FROM charge_instances
WHERE abs(invoiced_amount) > abs(amount);

\echo '=== 2. No charge settled beyond its amount ==='
SELECT id, name, amount, settled_amount
FROM charge_instances
WHERE abs(settled_amount) > abs(amount);

\echo '=== 3. settled_amount matches its allocation rows exactly ==='
SELECT ci.id, ci.name, ci.settled_amount, COALESCE(SUM(pa.amount), 0) AS rows_total
FROM charge_instances ci
LEFT JOIN payment_allocations pa
       ON pa.charge_instance_id = ci.id AND pa.deleted_at IS NULL
WHERE ci.deleted_at IS NULL
GROUP BY ci.id, ci.name, ci.settled_amount
HAVING ci.settled_amount <> COALESCE(SUM(pa.amount), 0);

\echo '=== 4. No payment over-allocated ==='
SELECT p.id, p.amount, SUM(pa.amount) AS allocated
FROM payments p
JOIN payment_allocations pa ON pa.payment_id = p.id AND pa.deleted_at IS NULL
WHERE p.status = 'SUCCESSFUL' AND p.deleted_at IS NULL
GROUP BY p.id, p.amount
HAVING SUM(pa.amount) > p.amount;

\echo '=== 5. Every account-backed invoice line claims a charge ==='
SELECT li.id, li.label, li.category
FROM invoice_line_items li
JOIN invoices i ON i.id = li.invoice_id
WHERE i.financial_account_id IS NOT NULL
  AND li.charge_instance_id IS NULL
  AND li.deleted_at IS NULL;

\echo '=== 6. No INITIAL_DEPOSIT charge exists (it is a cadence, not a charge) ==='
SELECT id, name FROM charge_instances WHERE category = 'INITIAL_DEPOSIT';
