# Runbook — Shared Financial Account

**Change:** one financial account spans every lease of a renewal chain, instead
of one account per lease. Charges gain a `lease_id` for grouping. Accounts gain
a `ACTIVE → CLOSURE_ELIGIBLE → CLOSED` lifecycle with a PM-driven close.

**Spec:** `docs/superpowers/specs/2026-08-11-lease-renewal-financial-account-design.md`
**Plan:** `docs/superpowers/plans/2026-08-18-shared-financial-account.md`
**Task:** `RENTL-51`
**Verification:** `services/main/scripts/verify-shared-account-invariants.sql`
plus the existing `services/main/scripts/verify-financial-invariants.sql`

---

## Read this first

**There is one environment.** `main` deploys to the Fly app
`rentloop-api-staging`, and that app *is* production. `fly.production.toml` does
not exist and the `prod` branch does not exist, so
`.github/workflows/api-deploy-production.yml` never fires. Everything the word
"staging" names in this repository is, for now, the live system.

**CI runs the safe migrations for you.** `api-deploy-staging.yml` has a
`sync-db` job that runs `make update-db` against the live database, gated on
`services/main/init/**` having changed, and it runs *before* the deploy job. So
merging to `main` migrates and then deploys, in that order, unattended.

**But a failed migration does not stop the deploy.** The deploy job is guarded
`if: ${{ always() && (needs.changes.result == 'success') }}` — `always()` plus a
condition that never inspects `sync-db`. A red migration still ships new code,
and per "Why step 2 precedes the deploy" below that is silent, not loud: every
lease renders as having no financial account. Until that guard is fixed, watch
the `sync-db` job to completion yourself.

**`make update-db` is safe by default.** It runs every job below except the
destructive one, which requires an explicit opt-in:

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

## The jobs

| Job | ID | Destructive |
|---|---|---|
| `AddSharedFinancialAccountLinks` | `202608180001` | No — adds 4 columns, creates 1 table |
| `BackfillSharedFinancialAccounts` | `202608180002` | No — populates links, writes no amounts |
| `RepairRenewalLeaseFinancialAccount` | `202608180003` | No — repairs lease `2608NHQ8DS` only |
| `AddLeaseType` | `202608190001` | No — adds `leases.type`, backfills from `parent_lease_id` |
| `NullableClosureClosedBy` | `202608190002` | No — drops a NOT NULL so the sweep can close without an actor |
| `DropLegacyFinancialAccountApplicationUnique` | `202608190003` | No — drops an index the model no longer declares |
| `DropFinancialAccountLeaseID` | `202608180004` | **Yes — irreversible**, opt-in only |

Job `202608190003` is the one to understand, because nothing local reveals the
problem it solves. `financial_accounts.tenant_application_id` still carries a
UNIQUE index in every deployed database, left over from when one application
meant one account. The model dropped that claim — a renewal may separate onto
its own account, which originates from the same application — but AutoMigrate
never drops an index it did not create, and the Go field was renamed
(`TenantApplicationID` → `OriginTenantApplicationID`, mapped back with a
`column:` tag), so GORM added a *second*, non-unique index under the new name
and left the old UNIQUE standing. A database built fresh from AutoMigrate never
had it, so the whole test suite passes locally while separating a renewal onto
its own account fails in production with SQLSTATE 23505.

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

**This is the only rehearsal that exists.** There is no second environment to
try the migration on, so the scratch database restored below is the last place
a mistake is free.

Performed twice:

- **2026-08-18** — 59 leases, 76 accounts, 1,084 charge instances,
  GHS 118,876 outstanding.
- **2026-08-19** — 62 leases, 79 accounts, 1,109 charge instances,
  **12,372,600** outstanding (the figure every step below compares against).
  All seven shared-account checks PASS and all six ledger invariants return
  zero rows, both before and after the drop; outstanding unchanged throughout;
  the `2608NHQ8DS` repair produced exactly 12 rows of 55,000 fully settled; the
  Job 4 guard was proved to bite before the drop was run for real. The full
  backend suite then passed 1,210/0 against the migrated data, and the
  Playwright suite 38/38.

  **This second rehearsal is why `DropLegacyFinancialAccountApplicationUnique`
  exists.** The first pass failed four assertions in `l4-renew-into-another-unit`
  with a 500: the legacy UNIQUE index on `tenant_application_id` refused the
  second account. Nothing local could have caught it — that index only exists in
  databases that predate the field rename. Re-rehearse on a fresh dump before
  any future migration for exactly this reason.

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
loudly. CI performs steps 2 and 4 for you, in that order, on the merge to
`main`; the rest are yours.

| # | Action | Who | Why here |
|---|---|---|---|
| 0 | Back up, and confirm the backup restores | You | After step 6 this is the only way back |
| 1 | `ALTER DATABASE ... SET search_path TO public, extensions;` | You, **before merging** | Job 1 cannot create its table without it, and CI will not stop for you |
| 2 | `make update-db` (every job but the drop) | CI (`sync-db`) | Old code ignores the new columns and table, so it keeps serving normally while leases get linked to accounts |
| 3 | Both verification scripts against prod | You | Real data. **Last safe abort point** — nothing has been destroyed |
| 4 | Deploy `services/main` | CI (`deploy`) | New code reads `leases.financial_account_id`; the old column still exists, so the deploy is reversible |
| 5 | Smoke production | You | Lease financials, application tab, invoice lists, Insights, the renewal wizard, a closed tenancy in both themes |
| 6 | `SHARED_ACCOUNT_MIGRATION_ALLOW_DROP=true make update-db` | You | **Point of no return.** Only after new code is confirmed healthy |
| 7 | Re-run both verification scripts | You | Confirms the drop changed nothing but the column |

Step 3 sits *between* two things CI does back to back, so in practice it is a
check you run immediately after the deploy rather than a gate you hold open. If
it fails, the abort is redeploying the previous image — the drop has not run,
so nothing is lost.

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
  - `apps/property-manager/e2e/specs/b1-approve-to-lease.spec.ts` used to build
    a URL from `account.lease_id`. **Fixed on 2026-08-19** — it now reads the
    lease off the account's charges, which is where approval records it.
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
