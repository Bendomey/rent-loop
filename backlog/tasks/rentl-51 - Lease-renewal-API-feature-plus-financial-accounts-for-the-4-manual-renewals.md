---
id: RENTL-51
title: 'Lease renewal: API feature plus financial accounts for the 4 manual renewals'
status: To Do
assignee: []
created_date: '2026-08-17 20:57'
labels:
  - backend
  - financials
  - feature
dependencies: []
references:
  - services/main/scripts/renew-lease-gifty-gosu.sql
  - services/main/internal/models/financial-account.go
  - services/main/internal/services/financials/materialise.go
  - services/main/internal/services/financials/account.go
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
There is no renewal feature. Renewals are done by hand-written SQL (see `services/main/scripts/renew-lease-gifty-gosu.sql`), written against the pre-financial-account model.

**Consequence today:** lease `2608NHQ8DS` (Gifty Gosu, AdomBi Villa Apartment 2 Amasaman, Room 4) is Active through 2027-08-01 with **no FinancialAccount**. Its money lives in the legacy `leases.meta` JSONB (`initial_deposit_fee: 660000`). It is invisible to the issuance sweep. Confirmed against the 2026-08-17 prod dump: 0 accounts bound to that lease.

The backfill did not miss it — accounts key off `tenant_applications`, and a renewal reuses its parent's application, whose single account was already bound to the parent lease `260732XOK3`.

**Now unblocked:** commit `20d60227` changed `FinancialAccount.TenantApplicationID` from `uniqueIndex` to `index`, so one application can carry several accounts — one per lease. Uniqueness still holds on `LeaseID`.

**Three further renewals are pending** (2 already paid, 1 unpaid). They were deliberately held back rather than run through the legacy script, to avoid creating three more orphans. The unpaid one is the important case: with no account, the sweep can never bill them.

**Reusable as-is** — the expensive machinery needs no change:
- `financials.MaterialiseRentInstances` is a pure function over rent terms
- the issuance sweep is account-driven and never reads a lease
- allocation, invoice composition and balance are all account-scoped
- `Lease.ParentLeaseId` already exists as a column, a repository filter and a transformation field

**Reusable from the Gifty script:** lease copying, unit-status recomputation, `unit_date_blocks` handling. **Do not reuse:** its `leases.meta` money handling or its `next_billing_date` reasoning — both belong to the model that was replaced.

Guards worth carrying over from that script: parent must be Completed, refuse a second renewal for the same parent, refuse if the unit already has an Active/Pending lease.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A renewal creates a child lease linked by parent_lease_id and its own FinancialAccount carrying the renewal term's rent charges
- [ ] #2 The renewal account reuses the parent's tenant_application_id (no new application row)
- [ ] #3 A renewal whose rent is already paid settles its charges; an unpaid renewal is left outstanding and is picked up by the daily issuance sweep
- [ ] #4 Guards refuse a second renewal for the same parent, and refuse when the unit already has an Active or Pending lease
- [ ] #5 Lease 2608NHQ8DS is given a FinancialAccount with its remaining term, without double-billing the year already paid
- [ ] #6 The 3 pending renewals are created in the new model
- [ ] #7 An e2e scenario in services/main/scripts/e2e/cases/ covers renew-then-sweep
<!-- AC:END -->
