# Runbook — Financial Account Backfill

**Change:** tenant financials move from invoice-centric to a `FinancialAccount`
with charges, allocations and composed invoices.

**Spec:** `docs/superpowers/specs/2026-08-05-tenant-financial-account-design.md`
**Plan:** `docs/superpowers/plans/2026-08-05-tenant-financial-account.md`
**Verification:** `services/main/scripts/verify-financial-backfill.sql`

---

## Read this first

**Migrations do not run on deploy.** There is no `release_command` in
`fly.staging.toml` or `fly.production.toml` — every migration below is run
manually by you, against whichever database your environment points at.

**`make update-db` is safe by default.** It runs Jobs 1 and 2 (structure and
backfill) and stops. The destructive Job 3 requires an explicit opt-in:

```bash
FINANCIAL_MIGRATION_ALLOW_DROP=true make update-db
```

Without that variable the job is not registered at all — so it is not recorded
as applied, and will still run later when you do set it. Watch for the log line
confirming which mode you are in:

```
[Migration] skipping DropLegacyFinancialColumns (set FINANCIAL_MIGRATION_ALLOW_DROP=true to run it)
[Migration] FINANCIAL_MIGRATION_ALLOW_DROP is set — legacy financial columns will be DROPPED
```

## The three jobs

| Job | ID | Destructive |
|---|---|---|
| `AddFinancialAccountTables` | `202608050001` | No — creates 4 tables, adds 2 columns |
| `BackfillFinancialAccounts` | `202608050002` | No — creates accounts/charges, links invoices, rebuilds allocations |
| `DropLegacyFinancialColumns` | `202608050003` | **Yes — irreversible** |

Job 3 drops `invoices.context_expense_id`, `invoices.context_lease_id`,
`invoices.context_tenant_application_id`, `expenses.context_lease_id`,
`leases.next_billing_date`, and the `lease_payments` table. Its `Rollback`
restores structure only — **the data is gone**.

---

## Stage 1 — Prod dump rehearsal

Do this before any deploy. It is not ceremonial: three backfill paths have never
run against real data (security deposits, expense-derived invoices, non-multiple
initial deposits). Local dev data was three identically-shaped applications.

### 1. Restore a dump to a scratch database

```bash
pg_dump "$PROD_DATABASE_URL" -Fc -f prod-$(date +%Y%m%d).dump
createdb rentloop_rehearsal
pg_restore -d rentloop_rehearsal --no-owner --no-privileges prod-$(date +%Y%m%d).dump
```

### 2. Run Jobs 1 and 2 only

```bash
cd services/main
DB_NAME=rentloop_rehearsal make update-db
```

Confirm the log says `skipping DropLegacyFinancialColumns`.

### 3. Verify — all nine gates must return zero rows

```bash
psql rentloop_rehearsal -f scripts/verify-financial-backfill.sql
```

| Gate | Asserts |
|---|---|
| 1 | No charge invoiced beyond its amount |
| 2 | No charge settled beyond its amount |
| 3 | `settled_amount` matches its allocation rows exactly |
| 4 | No payment over-allocated |
| 5 | Every account-backed invoice line claims a charge |
| 6 | Every expense-derived invoice can still derive a property |
| 6b | No invoice would lose its lease/application link |
| 7 | Invoice totals unchanged by line splitting |
| 8 | No `INITIAL_DEPOSIT` charge exists |
| 9 | Every application with rent terms has exactly one account |

**If any gate returns rows, stop. Do not run Job 3.**

To retry after a fix, restore the scratch database from the dump and start
again. Re-running the backfill in place means deleting its row from
`migrations`, which is fiddlier and easier to get wrong than a restore.

### 4. Hand-review the reconciliation

The informational query at the end of the script compares the new balance
against the old invoice-derived figure. **These legitimately differ** wherever
charges exist that were never invoiced — that is the entire point of the model.
Confirm every difference is uninvoiced future rent and nothing else.

### 5. Check the query that changed shape

`invoiceLeaseContextScope` moved from a direct indexed column read to a subquery
against `financial_accounts`. Both foreign keys carry unique indexes, so it
should be cheap — but it sits on the PM invoice-list path, so measure rather
than assume:

```bash
psql rentloop_rehearsal -c "
EXPLAIN ANALYZE
SELECT * FROM invoices
WHERE financial_account_id IN (
  SELECT id FROM financial_accounts
  WHERE deleted_at IS NULL AND lease_id = (SELECT id FROM leases LIMIT 1)
) LIMIT 50;"
```

### 6. What to look for specifically

Local data exercised none of these:

- **Security deposits** — a `SECURITY_DEPOSIT` charge should exist alongside rent
- **Expense-derived invoices** — gate 6 proves the `payer_property_id` rescue worked
- **Non-multiple initial deposits** (e.g. 10,500 against 1,000 rent) — expect 10
  full rent claims plus a 500 partial claim, not a lost remainder
- **Pending applications** — should get an account with `lease_id` and
  `tenant_id` both null. That is correct: no `Tenant` record exists until
  approval, and tenants cannot log in before then

### 7. Only when 3–6 are clean, run Job 3

```bash
FINANCIAL_MIGRATION_ALLOW_DROP=true DB_NAME=rentloop_rehearsal make update-db
psql rentloop_rehearsal -f scripts/verify-financial-backfill.sql
DB_NAME=rentloop_rehearsal make run-dev
```

Smoke the app against the rehearsal database: invoice lists, the application
financial tab, Insights.

---

## Stage 2 — Production

**The ordering is load-bearing.** Getting it wrong fails silently rather than
loudly.

| # | Action | Why here |
|---|---|---|
| 1 | `make update-db` against prod (Jobs 1+2) | Old code ignores the new column and tables, so it keeps serving normally while invoices get linked to accounts |
| 2 | `psql prod -f scripts/verify-financial-backfill.sql` | Same nine gates, real data. **Last safe abort point** — nothing destroyed yet |
| 3 | Deploy backend **+ Cube + frontend together** | New backend reads accounts, new Cube reads `financial_account_id`, the frontend needs the new API. All three break if split |
| 4 | Smoke production | Invoice lists, application financial tab, Insights. Columns still exist, so rolling the deploy back is still possible |
| 5 | `FINANCIAL_MIGRATION_ALLOW_DROP=true make update-db` | **Point of no return.** Only after new code is confirmed healthy |

### Why steps 1–2 precede the deploy

The new code queries `invoices.financial_account_id`. If it serves traffic
before Job 2 has run, every existing invoice looks unlinked and the PM's invoice
list returns empty. No error — just missing data.

### Why step 5 comes last

Job 3 drops columns the **old** code reads. Between steps 1 and 5 the deploy can
be rolled back freely. After step 5 it cannot: rollback requires restoring from
backup.

### Why the deploy is one release

`services/cube` deploys separately from `services/main`, but its `Invoices` and
`Payments` cubes now read `financial_account_id`. Deploying the Cube changes
before Job 2 means Insights sees unlinked invoices; deploying them after Job 3
without the code means the cubes reference dropped columns and the whole schema
fails to compile. They must ship together.

---

## Rollback

| Stage reached | How to roll back |
|---|---|
| After Jobs 1+2 | Redeploy old code. New tables and columns are inert — old code ignores them. Optionally run Job 2's `Rollback` to clear the data |
| After deploy, before Job 3 | Redeploy old code. Columns still exist and are still populated |
| After Job 3 | **Restore from backup.** The `Rollback` restores empty columns only |

---

## Stage 3 — Cleanup (after production)

These files exist only to move existing data across. Once every environment has
run them they are dead weight and can be deleted.

### When it is safe

Once **staging and production** have both run all three jobs. Local dev doesn't
matter — it can always be rebuilt with `make setup-db`, which produces the
current schema from AutoMigrate and has nothing to backfill.

Staging is the one easy to forget: deleting the jobs after production but before
staging leaves staging permanently unmigrated, and gormigrate will never run
them again because they are no longer registered. It fails silently — empty
invoice lists, not an error.

Check both before deleting:

```sql
SELECT id FROM migrations
WHERE id IN (
  '202608050001_ADD_FINANCIAL_ACCOUNT_TABLES',
  '202608050002_BACKFILL_FINANCIAL_ACCOUNTS',
  '202608050003_DROP_LEGACY_FINANCIAL_COLUMNS'
);
```

Three rows on each. Anything less, migrate that environment first.

### Why deletion is safe

- **Extra rows in `migrations` are harmless.** gormigrate checks whether each
  *registered* job has a row; rows with no matching job are ignored.
- **Fresh databases do not need these jobs.** `updateMigration()` AutoMigrates
  `FinancialAccount`, `ChargeDefinition`, `ChargeInstance` and
  `PaymentAllocation`, and `Invoice.FinancialAccountID` /
  `InvoiceLineItem.ChargeInstanceID` are ordinary model fields. Job 1 is
  redundant once it has run everywhere.
- **The dropped columns are already off the models**, so a fresh database never
  creates them and Job 3 has nothing to drop.
- **Git keeps the history.** Deleting the backfill file does not lose the record
  of how legacy data was mapped — that is what the commit is for.

### Safe to delete

| File | Note |
|---|---|
| `init/migration/jobs/add-financial-account-tables.go` | Fully covered by AutoMigrate |
| `init/migration/jobs/backfill-financial-accounts.go` | One-shot data move |
| `init/migration/jobs/backfill-financial-accounts-invoices.go` | Same |
| `init/migration/jobs/drop-legacy-financial-columns.go` | Columns no longer exist on the models |
| The three `jobs.*()` entries in `init/migration/main.go` | |
| The `FINANCIAL_MIGRATION_ALLOW_DROP` gate in `init/migration/main.go` | Goes with Job 3 — it has nothing left to gate |
| This runbook | Or move it to an `archive/` directory |

After deleting, `init/migration/main.go` should go back to a plain slice literal:

```go
m = gormigrate.New(db, gormigrate.DefaultOptions, []*gormigrate.Migration{
    ...
    jobs.AddMaintenanceRequestAssets(),
})
```

Then `go build ./... && go test ./...` and confirm `make setup-db` still
produces a working database from scratch — that is the real check that nothing
in the jobs was load-bearing.

### Worth keeping

**`scripts/verify-financial-backfill.sql` — do not delete it wholesale.**

Gates 1–5 and 8 are not migration checks; they are **invariants of the live
system**:

| Gate | Still true forever |
|---|---|
| 1 | No charge invoiced beyond its amount |
| 2 | No charge settled beyond its amount |
| 3 | `settled_amount` matches its allocation rows |
| 4 | No payment over-allocated |
| 5 | Every account-backed invoice line claims a charge |
| 8 | No `INITIAL_DEPOSIT` charge exists |

If any of those ever returns rows, the ledger has drifted and something in the
allocation engine is wrong. Keep them as a periodic data-integrity check.

Gates 6, 6b, 7 and 9 and the reconciliation query at the end *are*
migration-specific — delete those when you delete the jobs, and retitle the file
(e.g. `scripts/verify-financial-invariants.sql`) to reflect what it has become.

---

## Known limits of the guards

Job 3 carries two guards that refuse to run if data would be orphaned:

- expense-derived invoices with no derivable property
- invoices with a lease/application context but no financial account

Both check **data, not code**. They cannot tell whether the call sites were
migrated off the dropped columns. That is what the Stage 2 step 4 smoke test is
for — there is no automated substitute.
