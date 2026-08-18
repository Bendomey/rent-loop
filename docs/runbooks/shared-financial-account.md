# Runbook — Shared Financial Account

**Change:** one financial account spans every lease of a renewal chain, instead
of one account per lease. Charges gain a `lease_id` for grouping. Accounts gain
a `ACTIVE → CLOSURE_ELIGIBLE → CLOSED` lifecycle with a PM-driven close.

**Spec:** `docs/superpowers/specs/2026-08-11-lease-renewal-financial-account-design.md`
**Plan:** `docs/superpowers/plans/2026-08-18-shared-financial-account.md`
**Task:** `RENTL-51`
**Verification:** `services/main/scripts/verify-shared-account-invariants.sql`
plus the existing `services/main/scripts/verify-financial-invariants.sql`

> **Not ready to merge or deploy.** The tenancy UI (spec 3, `DRAFT-36`) is
> planned before this branch merges. This runbook is written and rehearsed so it
> is ready when that work lands — do not start Stage 2 until then.

---

## Read this first

**Migrations do not run on deploy.** There is no `release_command` in
`fly.staging.toml` or `fly.production.toml`. Every job below is run manually by
you, against whichever database your environment points at.

**`make update-db` is safe by default.** It runs Jobs 1–3 (structure, backfill,
and the single-row repair) and stops. The destructive Job 4 requires an explicit
opt-in:

```bash
SHARED_ACCOUNT_MIGRATION_ALLOW_DROP=true make update-db
```

Without that variable the job is **not registered at all** — so it is not
recorded as applied, and will still run later when you do set it. Watch for the
log line confirming which mode you are in:

```
[Migration] skipping DropFinancialAccountLeaseID (set SHARED_ACCOUNT_MIGRATION_ALLOW_DROP=true to run it)
[Migration] SHARED_ACCOUNT_MIGRATION_ALLOW_DROP is set — financial_accounts.lease_id will be DROPPED
```

### Prerequisite — search_path on Supabase

`uuid-ossp` lives in the `extensions` schema on Supabase, not `public`. Job 1
creates a table with `DEFAULT uuid_generate_v4()` and **will fail** with
`function uuid_generate_v4() does not exist` unless the database resolves it:

```sql
ALTER DATABASE <dbname> SET search_path TO public, extensions;
```

Run this first, on every environment. Reconnect afterwards — the setting
applies to new sessions.

## The four jobs

| Job | ID | Destructive |
|---|---|---|
| `AddSharedFinancialAccountLinks` | `202608180001` | No — adds 4 columns, creates 1 table |
| `BackfillSharedFinancialAccounts` | `202608180002` | No — populates links, writes no amounts |
| `RepairRenewalLeaseFinancialAccount` | `202608180003` | No — repairs lease `2608NHQ8DS` only |
| `DropFinancialAccountLeaseID` | `202608180004` | **Yes — irreversible** |

Job 4 drops `financial_accounts.lease_id` and its unique index. Its `Rollback`
restores an empty column — **the mapping is gone**. It lives on
`leases.financial_account_id` from then on.

Job 4 refuses to run if any account's `lease_id` is absent from
`leases.financial_account_id`, failing with
`financial_accounts.lease_id still holds mappings absent from leases.financial_account_id`.
That guard is not decoration: it is the only thing standing between a
half-finished backfill and a silently lost mapping.

---

## Stage 1 — Prod dump rehearsal

**Already performed on 2026-08-18** against a dump of 59 leases, 76 accounts,
1,084 charge instances and GHS 118,876 outstanding. Recorded here because the
result is the baseline to compare against, and because a second rehearsal is
still worth doing if the dump is older than the deploy.

### 1. Restore a dump to a scratch database

```bash
createdb rentloop_shared_account_rehearsal
psql -d rentloop_shared_account_rehearsal -f <prod dump>.sql
psql -d rentloop_shared_account_rehearsal -c \
  "ALTER DATABASE rentloop_shared_account_rehearsal SET search_path TO public, extensions;"
```

A Supabase dump errors on event triggers, `vault` and `realtime` objects owned
by roles that do not exist locally. Those are expected — the `public` schema is
what matters. Create the roles first to reduce noise:

```bash
for role in supabase_admin supabase_auth_admin supabase_realtime_admin \
            supabase_storage_admin pgbouncer authenticator anon \
            authenticated service_role; do
  psql -d postgres -qc "CREATE ROLE $role NOLOGIN" 2>/dev/null
done
```

### 2. Record the number that must not change

```bash
psql -d rentloop_shared_account_rehearsal -tAc "
SELECT COALESCE(SUM(amount - settled_amount),0)
FROM charge_instances WHERE deleted_at IS NULL AND voided_at IS NULL;"
```

Write it down. Every later step compares against it. On the 2026-08-18 dump it
was **11,887,600**.

### 3. Run Jobs 1–3

```bash
cd services/main
DB_NAME=rentloop_shared_account_rehearsal make update-db
```

Confirm the log says `skipping DropFinancialAccountLeaseID`.

### 4. Verify — every check must report PASS

```bash
psql -d rentloop_shared_account_rehearsal -f scripts/verify-shared-account-invariants.sql
psql -d rentloop_shared_account_rehearsal -f scripts/verify-financial-invariants.sql
```

| Check | Asserts |
|---|---|
| 1 | Every non-cancelled lease has an account |
| 2 | Every scoped charge points at a lease on its own account |
| 3 | An instance agrees with its definition on the lease |
| 4 | Every lease in a renewal chain shares one account |
| 5 | Every account with a lease has tenant and property denormalised |
| 6 | No `CLOSURE_ELIGIBLE`/`CLOSED` account has a Pending or Active lease |
| 7 | Every closed account has a closure record |
| 8 | Total outstanding — compare against step 2 |

Check 6 is the one that matters most: it is the
deposit-released-to-a-sitting-tenant invariant.

The older `verify-financial-invariants.sql` must also still pass — its six
queries must return **zero rows**. They are invariants of the live ledger, not
migration checks, so a failure there means the migration moved money.

**If any check fails, stop. Do not run Job 4.** To retry, drop and restore the
scratch database rather than deleting rows from `migrations`.

### 5. Confirm the lease `2608NHQ8DS` repair

```bash
psql -d rentloop_shared_account_rehearsal -c "
SELECT ci.name, ci.amount, ci.settled_amount, ci.period_start::date
FROM charge_instances ci JOIN leases l ON l.id = ci.lease_id
WHERE l.code = '2608NHQ8DS' ORDER BY ci.period_start;"
```

Expect **12 rows**, 55,000 each, all fully settled — a year of rent paid in
advance. Total outstanding must be **unchanged** from step 2, because the whole
term is prepaid and adds nothing owed.

### 6. Check the unscoped charges are the ones you expect

```bash
psql -d rentloop_shared_account_rehearsal -tAc "
SELECT COUNT(*) FILTER (WHERE lease_id IS NOT NULL) AS scoped,
       COUNT(*) FILTER (WHERE lease_id IS NULL AND period_start IS NOT NULL) AS unscoped_with_period,
       COUNT(*) FILTER (WHERE period_start IS NULL) AS no_period
FROM charge_instances WHERE deleted_at IS NULL;"
```

`no_period` rows are deposits and one-offs — expected. Every
`unscoped_with_period` row should belong to an **application-stage account with
no lease at all**, which cannot be scoped and correctly stays NULL. Confirm
that, rather than assuming it:

```bash
psql -d rentloop_shared_account_rehearsal -tAc "
SELECT COUNT(*) FROM charge_instances ci
WHERE ci.deleted_at IS NULL AND ci.lease_id IS NULL AND ci.period_start IS NOT NULL
  AND EXISTS (SELECT 1 FROM leases l
              WHERE l.financial_account_id = ci.financial_account_id AND l.deleted_at IS NULL);"
```

Must be **0**. Anything else means the period-to-term match is failing and
charges are being left unscoped on accounts that do have a lease.

### 7. Prove the Job 4 guard bites, then run it

Break one mapping on purpose and confirm the drop refuses:

```bash
psql -d rentloop_shared_account_rehearsal -c \
  "UPDATE leases SET financial_account_id = NULL
   WHERE id = (SELECT id FROM leases WHERE financial_account_id IS NOT NULL LIMIT 1);"
SHARED_ACCOUNT_MIGRATION_ALLOW_DROP=true DB_NAME=rentloop_shared_account_rehearsal make update-db
```

Expect a failure, the column intact, and **no row** in `migrations` for
`202608180004`. Then repair and run it for real:

```bash
psql -d rentloop_shared_account_rehearsal -c "
UPDATE leases l SET financial_account_id = fa.id
FROM financial_accounts fa
WHERE fa.lease_id = l.id AND fa.deleted_at IS NULL AND l.financial_account_id IS NULL;"
SHARED_ACCOUNT_MIGRATION_ALLOW_DROP=true DB_NAME=rentloop_shared_account_rehearsal make update-db
psql -d rentloop_shared_account_rehearsal -f scripts/verify-shared-account-invariants.sql
```

### 8. Smoke the app against the rehearsal database

```bash
DB_NAME=rentloop_shared_account_rehearsal make run-dev
```

Lease detail financials, the application financial tab, invoice lists,
Insights.

---

## Stage 2 — Production

**The ordering is load-bearing.** Getting it wrong fails silently rather than
loudly.

| # | Action | Why here |
|---|---|---|
| 1 | `ALTER DATABASE ... SET search_path TO public, extensions;` | Job 1 cannot create its table without it |
| 2 | `make update-db` against prod (Jobs 1–3) | Old code ignores the new columns and table, so it keeps serving normally while leases get linked to accounts |
| 3 | Both verification scripts against prod | Real data. **Last safe abort point** — nothing has been destroyed |
| 4 | Deploy `services/main` | New code reads `leases.financial_account_id`; the old column still exists, so the deploy is reversible |
| 5 | Smoke production | Lease financials, application tab, invoice lists, Insights |
| 6 | `SHARED_ACCOUNT_MIGRATION_ALLOW_DROP=true make update-db` | **Point of no return.** Only after new code is confirmed healthy |
| 7 | Re-run both verification scripts | Confirms the drop changed nothing but the column |

### Why step 2 precedes the deploy

The new code resolves a lease's account through `leases.financial_account_id`
and no longer reads `financial_accounts.lease_id` at all. If it serves traffic
before Job 2 has populated that column, **every lease looks like it has no
financial account** — the lease financials panel renders "no account" and the
application financial tab is empty. No error; just missing data.

### Why step 6 comes last

Job 4 drops a column the **old** code reads on every account lookup. Between
steps 2 and 6 the deploy can be rolled back freely. After step 6 it cannot:
rollback requires restoring from backup.

### Cube and the frontend

Neither blocks this release, but confirm before deploying:

- **Cube** (`services/cube/model/cubes/{Charges,Invoices,Payments}.js`) reads
  `financial_account_id`, never `financial_accounts.lease_id`. No Cube change
  is required and no coordinated deploy is needed.
- **Property manager app** — no application code reads `account.lease_id`. Two
  places reference it and should be tidied, neither blocking:
  - `apps/property-manager/e2e/specs/b1-approve-to-lease.spec.ts` builds a URL
    from `account.lease_id`. **This spec will fail after the deploy** — the
    field is gone from the API response. Point it at the lease's own id.
  - `apps/property-manager/types/lease.d.ts` documents `financial_account` as
    coming "from `financial_accounts.lease_id`". Stale wording only; the field
    still populates, resolved the other way round now.

---

## Rollback

| Stage reached | How to roll back |
|---|---|
| After Jobs 1–3 | Redeploy old code. The new columns and table are inert — old code ignores them. Optionally run Job 2's and Job 3's `Rollback` to clear the data |
| After deploy, before Job 4 | Redeploy old code. `financial_accounts.lease_id` still exists and is still populated |
| After Job 4 | **Restore from backup.** The `Rollback` restores an empty column only |

Job 3's `Rollback` deletes the charges, invoice, payment and allocations it
created for lease `2608NHQ8DS` and unlinks the lease. It is safe to re-run: every
statement is guarded on the lease code and the payment reference
`MIGRATION-2608NHQ8DS`.

---

## Stage 3 — Cleanup (after production)

Once **staging and production** have both run all four jobs, these migration
files exist only to move data that has already moved. They can be deleted, along
with this runbook's Stage 1. Local dev does not matter — `make setup-db`
produces the current schema from AutoMigrate with nothing to backfill.

`verify-shared-account-invariants.sql` is **not** cleanup. Like
`verify-financial-invariants.sql`, its checks are invariants of the live system
rather than migration gates, and it stays.

---

## Known traps

- **A rename job cannot work in this repo.** `AutoMigrate` runs *before* the
  gormigrate job list, so it sees a renamed Go field first and fails trying to
  add the column `NOT NULL` to a populated table. This is why
  `tenant_application_id` keeps its name and the Go field uses a `column:` tag.
  Remember it before writing any future rename.
- **Charges prepared against an application have no `lease_id` until approval.**
  Approval stamps them (`ChargeRepository.ScopeUnassignedToLease`, inside the
  approval transaction). An account still at application stage legitimately has
  unscoped charges.
- **Accounts are shared along a renewal chain, not by tenant and property.**
  Production has tenants holding several concurrent leases on different units at
  one property. Do not reintroduce a `(tenant_id, property_id)` uniqueness
  constraint — check 4 tests the chain instead, deliberately.
