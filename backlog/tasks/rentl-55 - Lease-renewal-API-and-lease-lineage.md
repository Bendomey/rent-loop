---
id: RENTL-55
title: Lease renewal API and lease lineage
status: In Progress
assignee: []
created_date: '2026-08-17 23:12'
updated_date: '2026-08-18 15:47'
labels:
  - backend
  - financials
  - feature
dependencies:
  - RENTL-51
references:
  - docs/superpowers/specs/2026-08-17-lease-renewal-api-design.md
  - docs/superpowers/specs/2026-08-11-lease-renewal-financial-account-design.md
  - services/main/internal/services/lease.go
  - services/main/internal/services/financials/materialise.go
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Designed in `docs/superpowers/specs/2026-08-17-lease-renewal-api-design.md` (spec 2 of 3). **Designed 2026-08-18, ready to plan.**

A renewal is a **new lease that continues an existing tenancy** — its own term, rent and charges, inheriting the money relationship its parent belonged to. Blocked on RENTL-51 (spec 1), which is implemented and rehearsed.

**Created Pending, finished by the sweeps.** The renewal is created `Pending` with `move_in_date` at the parent's `move_out_date`; the existing `ListDueForActivation` and `ListDueForCompletion` daily jobs activate it and complete the parent on the changeover day. No new cron. Creating it `Active` (what the manual script did) would leave the unit double-occupied for however long the renewal was signed in advance — and all three real renewals are being signed before expiry.

**A renewal may change the unit.** Money follows by default; `carry_financial_account: false` opens a new account instead. The flag is rejected outright on a same-unit renewal, where it is meaningless.

**Cadence is deliberately not in the request body.** `SelectIssuableCharges` skips charges that are fully settled or fully invoiced (`selection.go:42`), so a renewal paid in full at signing leaves the sweep's candidate set immediately and cadence never matters. It only shapes the first invoice of an *unpaid* renewal, and that is corrected through the existing billing-policy endpoint.

**Prerequisite bug:** `CreateLease` declares `ParentLeaseId` in its input and never assigns it to the `models.Lease` literal, so lineage is silently dropped. That is exactly how lease `2608NHQ8DS` came to need a hand-written repair.

The wider lineage enum (`EXTENSION`, `RENT_REVIEW`, `UNIT_CHANGE`, `TENANT_CHANGE`, `TERMINATION`) stays deferred — each raises its own account-sharing question and none has a feature asking for it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CreateLease assigns ParentLeaseId from CreateLeaseInput to the models.Lease literal — today it is declared and silently dropped
- [x] #2 Lease.Type exists with ORIGINAL and RENEWAL, defaulting to ORIGINAL, with a non-destructive migration backfilling RENEWAL where parent_lease_id IS NOT NULL, and both lease DTOs expose it
- [x] #3 POST .../leases/{lease_id}/renew creates a child lease as Pending with type RENEWAL and parent_lease_id set, guarded by property MANAGER
- [x] #4 The renewal resolves its financial account from its parent, reviving it when CLOSURE_ELIGIBLE; a unit change with carry_financial_account=false opens a new account via FinancialAccountService.OpenForLease instead
- [x] #5 The parent's charge definitions are closed and new ones opened scoped to the child lease; rent instances are materialised for the new term carrying the child's lease_id; no SECURITY_DEPOSIT charge is ever created
- [x] #6 Five guards refuse with distinct codes: parent not Active/Completed, parent already renewed (a Cancelled child does not block), move_in before the parent's move_out, destination unit at capacity for the term excluding this chain, and carry_financial_account sent on a same-unit renewal
- [x] #7 The renewal is activated and the parent completed by the existing daily lifecycle sweeps — no new cron
- [x] #8 The destination unit's occupancy is recomputed at renewal. The unit_date_blocks LEASE row is NOT written here — ActivateLease already writes it when the sweep activates the renewal, which is also the right moment for it to appear
- [x] #9 e2e group l covers renew-shares-account, the guards, renew-then-sweep, and renewing into another unit; the skip_case in j1 is removed
- [ ] #10 The three real renewals are created through the endpoint: 26073GCL1V (Paul Richardson, Room 6) and 2607GV0VDZ (Jenelle Mustapha, Room 7) settled via compose-invoice then offline-pay; 2607B8KCYF (Daniel Paintsil, Room 1) left outstanding for the sweep, with his billing cadence checked against what he has agreed to first
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented 2026-08-18. 20 new unit tests, all packages green, `make lint` clean. **Full e2e suite: 50/50 PASS**, including group L (L1 19/19, L2 18/18, L3 15/15, L4 28/28) and `j1` now that its `skip_case` is removed — specs 1 and 2 have met.

**AC #10 (the three real renewals) is deliberately unchecked** — it runs against production after deploy, not here.

**Two gaps the e2e suite caught that unit tests could not:**

- `OutputLease` did not expose `type`, so a client could not tell an original from a renewal. Both lease DTOs now carry it — spec 3's grouped lease list depends on it. Same class of gap as spec 1's missing `lease_id` on the charge DTO.
- My `l3` assertion expected `Unit.Status.Occupied` after the changeover, but the e2e fixture creates units with `max_occupants_allowed: 4`, so one active lease correctly reads `PartiallyOccupied`. The assertion — not the code — was wrong; it now asserts the unit was never released, which is what the case actually cares about.

**One bug caught in plan review before any code was written:** `linkRenewalFinancials` originally read `child.Unit.PropertyID`, but `CreateLease` does not preload associations, so a separated account would have been opened with no property. The destination unit is now passed in explicitly.

**Simplifications found by reading the code during planning**, all now reflected in the spec:
- The renewal writes no `unit_date_blocks` row — `ActivateLease` already does it (`lease.go:580-594`), and activation is the right moment. A Pending renewal deliberately does not block the calendar.
- It does not free the source unit on a move — `CompleteLease` → `releaseUnitIfNoActiveLease` handles that when the parent completes.
- "Never re-charges the deposit" needs no code: passing `SecurityDepositFee: 0` to the existing `MaterialiseForAccount` gives it, since `charge.go` treats 0 as not opted in.

Migration `202608190001_ADD_LEASE_TYPE` ran against both the dev database (183 ORIGINAL / 1 RENEWAL) and the production copy (58 / 1) — the single RENEWAL is lease `2608NHQ8DS` in both, exactly as predicted.

Not committed — all changes left unstaged per CLAUDE.md.
<!-- SECTION:NOTES:END -->
