-- Soft-delete rent invoices produced by the ListDueForBilling term-end bug.
--
--   psql "$DB_NAME" -f scripts/delete-phantom-term-end-invoices.sql
--
-- DRY RUN: change the final COMMIT to ROLLBACK. Guards and the full report
-- still run; nothing persists.
--
-- Background: ListDueForBilling matched on "next_billing_date <= now()" with no
-- move_out_date guard, while ListDueForCompletion only completes a lease the
-- following day (move_out_date < startOfToday). A fully-prepaid lease lands
-- next_billing_date exactly on move_out_date, so every expiring lease was
-- billed once for a period starting after the tenancy ended. The code fix is
-- the "next_billing_date < move_out_date" clause in internal/repository/
-- lease.go; this script clears the invoices already issued.
--
-- Soft delete, not hard: every model embeds BaseModelSoftDelete and GORM
-- filters deleted_at IS NULL, so setting it removes the invoices from the app
-- and stops the reminder cron, while staying reversible
-- (UPDATE ... SET deleted_at = NULL).
--
-- No reversing journal entry is posted. VoidInvoice would normally do that, but
-- the accounting DB is being rebuilt, so the Fincore ledger is not a concern.
--
-- Targets are DERIVED from the bug's signature rather than hardcoded, so this
-- also catches any invoice raised after the snapshot this was written against.
-- It refuses to touch anything paid or partially paid.

\set ON_ERROR_STOP on

BEGIN;

-- Candidates: LEASE_RENT invoices whose billing period begins at or after the
-- end of the lease term. Status is deliberately NOT filtered here -- a paid one
-- would mean a tenant actually handed over money, which is a decision for a
-- human, so the guard below raises instead of quietly skipping it.
CREATE TEMP TABLE phantom_invoices ON COMMIT DROP AS
SELECT i.id, i.code, i.status, i.total_amount, i.currency,
       l.code AS lease_code, l.move_out_date::date AS term_end,
       i.created_at::date AS billed_on, i.reminders_sent
FROM invoices i
JOIN leases l ON l.id = i.context_lease_id
WHERE i.context_type = 'LEASE_RENT'
  AND i.deleted_at IS NULL
  AND l.move_out_date IS NOT NULL
  AND i.created_at >= l.move_out_date;

DO $$
DECLARE
    v_total   int;
    v_bad     int;
    v_paid    text;
    v_withpay text;
BEGIN
    SELECT count(*) INTO v_total FROM phantom_invoices;

    IF v_total = 0 THEN
        RAISE NOTICE 'No phantom term-end invoices found — nothing to do.';
        RETURN;
    END IF;

    -- Guard 1: refuse if any candidate carries money.
    SELECT count(*), string_agg(code || ' (' || status || ')', ', ')
      INTO v_bad, v_paid
      FROM phantom_invoices
     WHERE status <> 'ISSUED';

    IF v_bad > 0 THEN
        RAISE EXCEPTION 'Refusing to delete — % invoice(s) are not ISSUED: %',
            v_bad, v_paid;
    END IF;

    -- Guard 2: refuse if any candidate has a payment attached.
    SELECT count(*), string_agg(DISTINCT pi.code, ', ')
      INTO v_bad, v_withpay
      FROM phantom_invoices pi
      JOIN payments p ON p.invoice_id = pi.id AND p.deleted_at IS NULL;

    IF v_bad > 0 THEN
        RAISE EXCEPTION 'Refusing to delete — payments exist against: %', v_withpay;
    END IF;

    RAISE NOTICE 'Soft-deleting % phantom term-end invoice(s).', v_total;
END $$;

\echo ''
\echo '=== Invoices being soft-deleted ==='
SELECT code, lease_code, term_end, billed_on,
       total_amount / 100.0 AS amount, currency, status, reminders_sent
FROM phantom_invoices
ORDER BY billed_on;

\echo ''
\echo '=== Total being written off ==='
SELECT currency, count(*) AS invoices, sum(total_amount) / 100.0 AS total
FROM phantom_invoices GROUP BY currency;

-- Line items first, mirroring how GORM cascades a soft delete: the parent going
-- away should not leave its children visible to any query that joins them.
UPDATE invoice_line_items
   SET deleted_at = now(), updated_at = now()
 WHERE invoice_id IN (SELECT id FROM phantom_invoices)
   AND deleted_at IS NULL;

UPDATE invoices
   SET deleted_at = now(), updated_at = now()
 WHERE id IN (SELECT id FROM phantom_invoices)
   AND deleted_at IS NULL;

\echo ''
\echo '=== Verification: these must all now read deleted ==='
SELECT i.code, i.status,
       (i.deleted_at IS NOT NULL) AS invoice_deleted,
       (SELECT count(*) FROM invoice_line_items li
         WHERE li.invoice_id = i.id AND li.deleted_at IS NULL) AS live_line_items
FROM invoices i
JOIN phantom_invoices p ON p.id = i.id
ORDER BY i.code;

\echo ''
\echo '=== Remaining live term-end invoices (expect 0 rows) ==='
SELECT i.code, l.code AS lease_code
FROM invoices i
JOIN leases l ON l.id = i.context_lease_id
WHERE i.context_type = 'LEASE_RENT'
  AND i.deleted_at IS NULL
  AND l.move_out_date IS NOT NULL
  AND i.created_at >= l.move_out_date;

COMMIT;
