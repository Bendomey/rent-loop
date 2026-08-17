-- One-off manual lease renewal: Gifty Gosu, AdomBi Villa Apartment 2 Amasaman, Room 4.
--
-- The API has no renewal feature yet, but the landlord wants to renew a lease
-- that has already completed. This writes the rows ApproveTenantApplication +
-- ActivateLease would have written, and nothing else.
--
--   psql "$DB_NAME" -f scripts/renew-lease-gifty-gosu.sql
--
-- DRY RUN: change the final COMMIT to ROLLBACK. Guards, code generation and
-- all verification output still run; nothing persists.
--
-- Writes:
--   1. A new Active lease copied from the parent, linked by parent_lease_id
--   2. units.status, recomputed the way the Go code computes it
--   3. A unit_date_blocks LEASE row covering the new term
--
-- Deliberately does NOT:
--   * Touch the parent lease. It completed legitimately on 2026-08-02; its
--     history stays intact.
--   * Create a tenant_applications row. leases.tenant_application_id is NOT
--     NULL and a renewal has no application of its own, so it reuses the
--     parent's. This makes application->lease 1:many for that application.
--   * Seed financials. financial_accounts / charge_instances do not exist in
--     this database — that schema is unreleased (verified with to_regclass).
--   * Set a tenant status. No such column exists on tenants or tenant_accounts;
--     a tenant reads as active by virtue of holding an Active lease.
--   * Attach documents. lease_agreement_document_url stays NULL by request.
--   * Delete the parent's date block. CompleteLease does not remove it either,
--     so leaving it matches existing behaviour. The unique index on
--     (unit_id, lease_id) WHERE lease_id IS NOT NULL AND deleted_at IS NULL is
--     per-lease, so the new block does not collide.
--
-- ---------------------------------------------------------------------------
-- next_billing_date is intentionally NULL, and this diverges from the code.
--
-- ActivateLease (internal/services/lease.go:404-438) derives it from the
-- initial deposit: cycles = initial_deposit_fee / rent_fee = 660000 / 55000 =
-- 12, giving move_in + 12 months = 2027-08-01.
--
-- We store NULL instead, on purpose. The billing cron selects on
-- "status = Active AND next_billing_date IS NOT NULL AND next_billing_date <=
-- now()" (internal/repository/lease.go:323), so NULL means never billed —
-- correct here, since the year is paid in full.
--
-- Storing 2027-08-01 would be worse: TypeLeaseRentInvoiceGeneration and
-- TypeLeaseCompletion are both registered at "0 0 * * *" (internal/queue/
-- worker.go:92,128) with no ordering guarantee, so on 2027-08-01 billing could
-- raise a 13th-month invoice before completion nulls the field.
-- ---------------------------------------------------------------------------

\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    -- ---- inputs -------------------------------------------------------
    v_parent_lease_id uuid := '09b65775-13b0-4f90-80ee-890666525a0b'; -- lease 260732XOK3
    v_move_in         timestamptz := '2026-08-01 00:00:00+00';        -- continuous with parent
    v_stay_duration   bigint := 12;
    v_stay_frequency  text := 'MONTHLY';
    -- Optional: a client_users.id to credit as activator. ActivateLease always
    -- sets this; the column is nullable, so NULL is valid for a manual run.
    v_activated_by    uuid := NULL;

    -- ---- derived ------------------------------------------------------
    v_alphabet   CONSTANT text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    v_parent     leases%ROWTYPE;
    v_move_out   timestamptz;
    v_code       text;
    v_new_id     uuid;
    v_unit_name  text;
    v_max_occ    int;
    v_occupying  bigint;
    v_new_status text;
BEGIN
    -- Guard 1: parent exists and is genuinely finished.
    SELECT * INTO v_parent FROM leases
    WHERE id = v_parent_lease_id AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Parent lease % not found', v_parent_lease_id;
    END IF;

    IF v_parent.status <> 'Lease.Status.Completed' THEN
        RAISE EXCEPTION 'Parent lease % is %, expected Lease.Status.Completed',
            v_parent.code, v_parent.status;
    END IF;

    -- Guard 2: refuse to run twice. Without this, a re-run silently creates a
    -- second renewal and a duplicate date block.
    IF EXISTS (
        SELECT 1 FROM leases
        WHERE parent_lease_id = v_parent_lease_id AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Lease % already has a renewal — refusing to create another',
            v_parent.code;
    END IF;

    -- Guard 3: the unit must not already be spoken for. Same statuses
    -- CountActiveByUnitID counts (internal/repository/lease.go:167-182).
    IF EXISTS (
        SELECT 1 FROM leases
        WHERE unit_id = v_parent.unit_id
          AND deleted_at IS NULL
          AND status IN ('Lease.Status.Pending', 'Lease.Status.Active')
    ) THEN
        RAISE EXCEPTION 'Unit % already has an Active or Pending lease', v_parent.unit_id;
    END IF;

    -- Mirrors leaseEndDate() (internal/services/lease.go:987-1009): the
    -- "monthly" branch is moveIn.AddDate(0, duration, 0).
    --
    -- Go's AddDate normalises month-end overflow (Jan 31 + 1mo -> Mar 3) while
    -- Postgres clamps (-> Feb 28). They agree for any day <= 28; v_move_in is
    -- day 1, so this is exact. Revisit if you retarget a month-end move-in.
    IF v_stay_frequency <> 'MONTHLY' THEN
        RAISE EXCEPTION 'Script only derives move_out_date for MONTHLY stays, got %',
            v_stay_frequency;
    END IF;
    v_move_out := v_move_in + (v_stay_duration || ' months')::interval;

    -- Code format matches lib.GenerateCode (internal/lib/code-generator.go):
    -- YYMM + 6 chars of [A-Z0-9], retried until unique.
    LOOP
        SELECT to_char(now(), 'YYMM') || string_agg(
                   substr(v_alphabet, (floor(random() * length(v_alphabet)) + 1)::int, 1), '')
          INTO v_code
          FROM generate_series(1, 6);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM leases WHERE code = v_code);
    END LOOP;

    -- ---- 1. the renewal lease -----------------------------------------
    INSERT INTO leases (
        code, status,
        unit_id, tenant_id, tenant_application_id,
        rent_fee, rent_fee_currency, payment_frequency,
        meta,
        move_in_date, stay_duration, stay_duration_frequency, move_out_date,
        activated_at, activated_by_id,
        next_billing_date,
        parent_lease_id,
        reminders_sent
    ) VALUES (
        v_code, 'Lease.Status.Active',
        v_parent.unit_id, v_parent.tenant_id, v_parent.tenant_application_id,
        v_parent.rent_fee, v_parent.rent_fee_currency, v_parent.payment_frequency,
        -- Full year paid up front, recorded the same way the parent recorded it.
        jsonb_build_object(
            'initial_deposit_fee',           v_parent.rent_fee * v_stay_duration,
            'initial_deposit_fee_currency',  v_parent.rent_fee_currency,
            'security_deposit_fee',          NULL,
            'security_deposit_fee_currency', v_parent.rent_fee_currency
        ),
        v_move_in, v_stay_duration, v_stay_frequency, v_move_out,
        now(), v_activated_by,
        NULL,                     -- see header note
        v_parent_lease_id,
        '{}'                      -- fresh reminder state for the new term
    )
    RETURNING id INTO v_new_id;

    -- ---- 2. recompute unit occupancy ----------------------------------
    -- Mirrors ApproveTenantApplication (internal/services/tenant-application.go
    -- :1147-1158): count occupying leases *after* inserting, then compare
    -- against MaxOccupantsAllowed. Computed rather than hardcoded so a unit
    -- with capacity > 1 correctly lands on PartiallyOccupied.
    SELECT max_occupants_allowed, name INTO v_max_occ, v_unit_name
    FROM units WHERE id = v_parent.unit_id;

    SELECT count(*) INTO v_occupying
    FROM leases
    WHERE unit_id = v_parent.unit_id
      AND deleted_at IS NULL
      AND status IN ('Lease.Status.Pending', 'Lease.Status.Active');

    IF v_occupying >= v_max_occ THEN
        v_new_status := 'Unit.Status.Occupied';
    ELSIF v_occupying > 0 THEN
        v_new_status := 'Unit.Status.PartiallyOccupied';
    END IF;

    -- SetSystemUnitStatus is a plain status write with no side effects
    -- (internal/services/unit.go:416-449), so a direct UPDATE is equivalent.
    IF v_new_status IS NOT NULL THEN
        UPDATE units
           SET status = v_new_status, updated_at = now()
         WHERE id = v_parent.unit_id AND status IS DISTINCT FROM v_new_status;
    END IF;

    -- ---- 3. block the calendar for the new term ------------------------
    -- Field-for-field what ActivateLease passes to CreateSystemBlock
    -- (internal/services/lease.go:459-466): type LEASE, reason 'Active lease',
    -- no created_by_client_user_id.
    INSERT INTO unit_date_blocks (
        unit_id, start_date, end_date, block_type, reason, lease_id
    ) VALUES (
        v_parent.unit_id, v_move_in::date, v_move_out::date,
        'LEASE', 'Active lease', v_new_id
    );

    RAISE NOTICE 'Renewed % -> % (%)', v_parent.code, v_code, v_new_id;
    RAISE NOTICE 'Unit % : % to % | occupying %/% -> %',
        v_unit_name, v_move_in::date, v_move_out::date,
        v_occupying, v_max_occ, coalesce(v_new_status, '(unchanged)');
END $$;

\echo ''
\echo '=== Parent and renewal ==='
SELECT l.code, l.status, l.rent_fee / 100.0 AS rent, l.rent_fee_currency,
       l.payment_frequency, l.move_in_date::date, l.move_out_date::date,
       l.next_billing_date, l.lease_agreement_document_url AS doc_url,
       p.code AS parent_code
FROM leases l
LEFT JOIN leases p ON p.id = l.parent_lease_id
WHERE l.id = '09b65775-13b0-4f90-80ee-890666525a0b'
   OR l.parent_lease_id = '09b65775-13b0-4f90-80ee-890666525a0b'
ORDER BY l.move_in_date;

\echo ''
\echo '=== Unit status (expect Unit.Status.Occupied, capacity 1) ==='
SELECT u.name, u.status, u.max_occupants_allowed,
       (SELECT count(*) FROM leases l
         WHERE l.unit_id = u.id AND l.deleted_at IS NULL
           AND l.status IN ('Lease.Status.Pending', 'Lease.Status.Active')) AS occupying
FROM units u
WHERE u.id = (SELECT unit_id FROM leases WHERE id = '09b65775-13b0-4f90-80ee-890666525a0b');

\echo ''
\echo '=== Date blocks on the unit ==='
SELECT b.start_date, b.end_date, b.block_type, b.reason, l.code AS lease_code
FROM unit_date_blocks b
LEFT JOIN leases l ON l.id = b.lease_id
WHERE b.unit_id = (SELECT unit_id FROM leases WHERE id = '09b65775-13b0-4f90-80ee-890666525a0b')
  AND b.deleted_at IS NULL
ORDER BY b.start_date;

COMMIT;
