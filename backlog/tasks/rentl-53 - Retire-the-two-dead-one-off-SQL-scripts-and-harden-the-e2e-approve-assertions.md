---
id: RENTL-53
title: Retire the two dead one-off SQL scripts and harden the e2e approve assertions
status: To Do
assignee: []
created_date: '2026-08-17 20:58'
labels:
  - backend
  - cleanup
  - testing
dependencies: []
references:
  - services/main/scripts/delete-phantom-term-end-invoices.sql
  - services/main/scripts/renew-lease-gifty-gosu.sql
  - services/main/scripts/e2e/cases/
  - docs/runbooks/financial-account-backfill.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cleanup found during the financial-account migration rehearsal. Low risk, but both items mislead whoever hits them next.

**1. Two scripts in `services/main/scripts/` can no longer run.** Both were applied to prod before the 2026-08-17 dump and are now unrunnable against a migrated database, because job 3 `DropLegacyFinancialColumns` drops the columns they reference:

- `delete-phantom-term-end-invoices.sql` joins `invoices.context_lease_id` (dropped)
- `renew-lease-gifty-gosu.sql` inserts `leases.next_billing_date` (dropped), and writes money into the legacy `leases.meta` shape

Both are self-protecting — re-running them during the rehearsal was a clean no-op and a guard refusal respectively — so nothing is at risk. They just shouldn't sit in `scripts/` looking runnable. Delete, or move to `scripts/archive/` with a note that they are historical. Git keeps the record either way.

Related: `docs/runbooks/financial-account-backfill.md` Stage 3 already describes retiring the migration jobs and retitling `verify-financial-backfill.sql` to `verify-financial-invariants.sql` (keeping gates 1-5 and 8 as live invariants, dropping the migration-specific 6, 6b, 7, 9). Worth doing in the same pass once staging and production have both run all three jobs.

**2. The e2e harness hides approval failures.** `d1-cadence-every-period.sh`, `d2`, `d3`, `d4`, `d6` and `b3-compose-due-date.sh` call `approve_application >/dev/null` without asserting the status, then use `$LEASE_ID`.

During the rehearsal, approval was failing with a hard HTTP 400 (`column "next_billing_date" ... does not exist`). In the A-group, which does `assert_status 200 "application approved"`, the error surfaced immediately with the SQL message attached. In the D-group it was invisible: `LEASE_ID` stayed empty and the failures appeared much later as "expected 2 invoices, got 0", pointing at the sweep rather than the real cause.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 delete-phantom-term-end-invoices.sql and renew-lease-gifty-gosu.sql are deleted or moved to an archive directory and clearly marked historical
- [ ] #2 Every e2e case that calls approve_application asserts its status before using LEASE_ID
- [ ] #3 ./run-all.sh still passes after the changes
<!-- AC:END -->
