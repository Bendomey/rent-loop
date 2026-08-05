-- Verification for BackfillFinancialAccounts (Job 2).
--
-- Every query below MUST return zero rows before DropLegacyFinancialColumns
-- (Job 3) is allowed to run. Job 3 is irreversible: the columns it drops carry
-- the only link some records have to their lease, application or property.
--
--   psql "$DB_NAME" -f scripts/verify-financial-backfill.sql
--
-- Query 7 is the exception — see its note.

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

\echo '=== 6. Every expense-derived invoice can still derive a property ==='
SELECT id, code
FROM invoices
WHERE context_expense_id IS NOT NULL AND payer_property_id IS NULL;

\echo '=== 6b. GATE: no invoice would lose its lease/application link ==='
SELECT id, code, context_type
FROM invoices
WHERE (context_lease_id IS NOT NULL OR context_tenant_application_id IS NOT NULL)
  AND financial_account_id IS NULL
  AND deleted_at IS NULL;

\echo '=== 7. Invoice totals unchanged by line splitting ==='
-- INITIAL_DEPOSIT lines are split into one line per rent period. The invoice
-- total must be identical to the sum of its (new) lines — the split changes
-- presentation, never money.
SELECT i.id, i.code, i.total_amount, COALESCE(SUM(li.total_amount), 0) AS line_total
FROM invoices i
LEFT JOIN invoice_line_items li
       ON li.invoice_id = i.id AND li.deleted_at IS NULL
WHERE i.financial_account_id IS NOT NULL AND i.deleted_at IS NULL
GROUP BY i.id, i.code, i.total_amount
HAVING i.total_amount <> COALESCE(SUM(li.total_amount), 0);

\echo '=== 8. No INITIAL_DEPOSIT charge exists (it is a cadence, not a charge) ==='
SELECT id, name FROM charge_instances WHERE category = 'INITIAL_DEPOSIT';

\echo '=== 9. Every application with rent terms has exactly one account ==='
SELECT ta.id, ta.code
FROM tenant_applications ta
LEFT JOIN financial_accounts fa
       ON fa.tenant_application_id = ta.id AND fa.deleted_at IS NULL
WHERE ta.deleted_at IS NULL
  AND ta.rent_fee IS NOT NULL
  AND ta.payment_frequency IS NOT NULL
  AND ta.desired_move_in_date IS NOT NULL
  AND fa.id IS NULL;

\echo '=== INFORMATIONAL: per-account balance reconciliation ==='
-- New-model balance vs the old invoice-derived figure. These legitimately
-- DIFFER wherever charges exist that were never invoiced — which is the entire
-- point of the new model. Review each row by hand and confirm the difference is
-- uninvoiced future rent and nothing else.
SELECT fa.code,
       COALESCE(SUM(ci.amount - ci.settled_amount), 0) AS new_balance,
       COALESCE((
         SELECT SUM(i.total_amount) FROM invoices i
         WHERE i.financial_account_id = fa.id
           AND i.status <> 'VOID' AND i.deleted_at IS NULL
       ), 0) - COALESCE((
         SELECT SUM(p.amount) FROM payments p
         JOIN invoices i2 ON i2.id = p.invoice_id
         WHERE i2.financial_account_id = fa.id
           AND p.status = 'SUCCESSFUL' AND p.deleted_at IS NULL
       ), 0) AS old_balance
FROM financial_accounts fa
LEFT JOIN charge_instances ci
       ON ci.financial_account_id = fa.id
      AND ci.voided_at IS NULL AND ci.deleted_at IS NULL
WHERE fa.deleted_at IS NULL
GROUP BY fa.id, fa.code
ORDER BY fa.code;
