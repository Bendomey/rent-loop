---
id: RENTL-51
title: 'Shared financial account across a tenancy: schema, closure lifecycle, backfill'
status: In Progress
assignee: []
created_date: '2026-08-17 20:57'
updated_date: '2026-08-18 13:29'
labels:
  - backend
  - financials
  - feature
dependencies: []
references:
  - docs/superpowers/specs/2026-08-11-lease-renewal-financial-account-design.md
  - services/main/internal/models/financial-account.go
  - services/main/internal/models/charge-instance.go
  - services/main/internal/models/charge-definition.go
  - services/main/internal/services/financials/account.go
  - services/main/internal/services/financials/types.go
  - docs/runbooks/archive/financial-account-backfill.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Designed in `docs/superpowers/specs/2026-08-11-lease-renewal-financial-account-design.md` (spec 1 of 3). **Implemented and rehearsed — see Implementation Notes.**

**Core idea:** a financial account is a continuing financial relationship; the leases of a renewal chain are contractual terms inside it. A renewal adds a term to an existing relationship; it does not create a new money relationship.

**Accounts are shared along a RENEWAL CHAIN.** A renewal reuses its parent's account (reviving it if `CLOSURE_ELIGIBLE`); everything else opens its own. This is *not* keyed on tenant+property — the rehearsal found two production tenants holding several concurrent leases on different units at one property, one of them six leases across four units. Those are separate money relationships with separate deposits. `tenant_id` and `property_id` stay on the account as denormalisation for reporting, not as a key.

`financial_accounts.lease_id` and its `uniqueIndex` are dropped and replaced by `leases.financial_account_id`, which is what lets many leases point at one account. Commit `20d60227`'s intent (one account per lease) is reversed; its index change is harmless and stands.

**Charges gain contractual context without losing account ownership.** `ChargeDefinition` and `ChargeInstance` gain a nullable `lease_id`. Set means charged under that contract (rent, VAT, damage, and the deposit against its originating lease); NULL means it belongs to the relationship with no contractual home (credits, write-offs, cross-term adjustments). Balance stays account-wide — charges are *grouped* by lease, never *split*.

**Closure is greenfield, not a change.** Nothing in the codebase ever set `FinancialAccount.Status = 'CLOSED'`. This task adds `ACTIVE → CLOSURE_ELIGIBLE → CLOSED`, where lease termination only makes an account *eligible* and a PM closes it explicitly. Deposits are released at closure, so an automatic close would refund a deposit to a tenant still in the unit.

**Reusable as-is:** `MaterialiseRentInstances` is pure; the issuance sweep is account-driven and never reads a lease; allocation, invoice composition and balance are all account-scoped.

**Scope moved out of this task:** the renewal endpoint, the `CreateLease` `ParentLeaseId` bug, lease lineage, and creating the 3 pending renewals all belong to the renewal-API task (spec 2, RENTL-55). Repairing lease `2608NHQ8DS` stayed here — existing broken data, not new work.

**The `2608NHQ8DS` figure, confirmed against the dump:** `initial_deposit_fee: 660000` is **a year of rent paid in advance, not a deposit** — 660,000 pesewas at 55,000/month, exactly 12 months. `initial_deposit_fee` means advance rent throughout this system and is separate from `security_deposit_fee`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Accounts are shared along a renewal chain: a renewal reuses its parent's account (reviving a CLOSURE_ELIGIBLE one), everything else opens its own. NOT keyed on tenant+property — production has tenants holding concurrent leases on several units at one property
- [x] #2 leases.financial_account_id replaces financial_accounts.lease_id, and charge_definitions.lease_id / charge_instances.lease_id exist as nullable columns
- [x] #3 Account balance and payment history stay account-wide; charges can be filtered by lease_id via GET /v1/financial-accounts/{id}/charges, and lease_id is exposed on the charge response
- [x] #4 Charges prepared against an application are stamped with the lease at approval, so a new account's charges are never left unscoped
- [x] #5 An account reaches CLOSURE_ELIGIBLE only when every lease on it has ended; a live lease blocks it
- [x] #6 Closing is an explicit PM action writing a FinancialAccountClosure event; outstanding balance and an unresolved deposit block it, missing move-out evidence only warns
- [x] #7 Reopening a closed account is a recorded action on the closure row, not a silent status flip
- [x] #8 Migration backfills lease_id on all existing charges by period_start against the lease term (not created_at), with total account balance provably unchanged
- [x] #9 Lease 2608NHQ8DS is linked to its parent's account with 12 monthly rent charges of 55,000, settled by a pre-system Payment of 660,000 with allocations, adding nothing to outstanding
- [x] #10 e2e group j covers lease-scoped charges, closure refused while a lease is live, and closure releasing the deposit; the full suite passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and rehearsed against the 2026-08-18 production dump (59 leases, 76 accounts, 1,084 charge instances, GHS 118,876 outstanding). Full e2e suite: 46/46 PASS. Unit tests: 28 new, all packages green. `make lint` clean.

**Two design decisions changed during the rehearsal, both because production data contradicted the spec:**

1. **Account identity is the renewal chain, not tenant+property.** Two tenants hold several concurrent leases on *different units at one property* — one has six leases across four units, none of them renewals. Keying on tenant+property would have merged separate deposits into one ledger. The application-stage merge the spec originally called for is gone with this: every application gets its own account, so there is no duplicate to merge. `ShouldMergeAccounts`, `Merge` and `ReassignAccount` were removed.

2. **`tenant_application_id` is not renamed.** This repo runs `AutoMigrate` before the migration job list, so it tried to add `origin_tenant_application_id NOT NULL` to a populated table and failed before any rename job could run. The Go field carries the new name via a `column:` tag instead. The demotion to provenance — the part that mattered — is unaffected.

**Two gaps the e2e suite caught that unit tests did not:**

- Charges prepared at application stage were never given a `lease_id` at approval, so every new account would have had unscoped charges and an empty "This Lease" view. Fixed with `ChargeRepository.ScopeUnassignedToLease`, called inside the approval transaction.
- `OutputChargeInstance` did not expose `lease_id`, so the data existed but no client could see it.

Also fixed: `SetFinancialAccount` originally read the lease back through `GetOneWithPopulate`, which uses the base connection rather than `lib.ResolveDB` — invisible inside the approval transaction. Now a targeted UPDATE.

**Migration is four jobs, not three** (the single-row repair was split from the structural backfill so they roll back independently):
- `202608180001_ADD_SHARED_FINANCIAL_ACCOUNT_LINKS`
- `202608180002_BACKFILL_SHARED_FINANCIAL_ACCOUNTS`
- `202608180003_REPAIR_RENEWAL_LEASE_FINANCIAL_ACCOUNT`
- `202608180004_DROP_FINANCIAL_ACCOUNT_LEASE_ID` — gated behind `SHARED_ACCOUNT_MIGRATION_ALLOW_DROP=true`, with an orphan guard that was verified to refuse and to leave the job unrecorded.

**Supabase gotcha:** `uuid-ossp` lives in the `extensions` schema, so Job 1 fails unless `ALTER DATABASE <db> SET search_path TO public, extensions;` has been run.

The `2608NHQ8DS` figure is confirmed: 660,000 pesewas of advance rent, exactly 12 months at 55,000/month. Total outstanding was byte-identical (11,887,600) before and after the whole migration.

Not committed — all changes left unstaged per CLAUDE.md.

**Merge is gated on the frontend.** The tenancy UI (DRAFT-36, spec 3) gets planned before this branch merges — the backend work is complete and rehearsed, but it ships together with the UI rather than ahead of it. `docs/runbooks/shared-financial-account.md` carries the same gate at the top; do not start its Stage 2 until the frontend work lands.

Two frontend items this change creates, both recorded in the runbook's Cube-and-frontend section:
- `apps/property-manager/e2e/specs/b1-approve-to-lease.spec.ts` reads `account.lease_id` to build a URL. That field is gone from the API response, so the spec will fail — point it at the lease's own id.
- `apps/property-manager/types/lease.d.ts:57-62` documents `financial_account` as coming from `financial_accounts.lease_id`. Stale wording only; the field still populates, resolved the other way round now.
<!-- SECTION:NOTES:END -->
