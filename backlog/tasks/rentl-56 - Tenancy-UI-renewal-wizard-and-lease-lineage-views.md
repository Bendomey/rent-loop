---
id: RENTL-56
title: 'Tenancy UI: renewal wizard and lease lineage views'
status: To Do
assignee: []
created_date: '2026-08-17 23:13'
updated_date: '2026-08-18 21:36'
labels:
  - frontend
  - financials
  - feature
dependencies:
  - RENTL-51
  - RENTL-55
references:
  - docs/superpowers/specs/2026-08-17-tenancy-ui-design.md
  - docs/superpowers/specs/2026-08-17-lease-renewal-api-design.md
  - docs/superpowers/specs/2026-08-11-lease-renewal-financial-account-design.md
  - apps/property-manager/app/modules/properties/property/occupancy/leases
  - >-
    apps/property-manager/app/modules/properties/property/occupancy/applications/application/move-in
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Designed in `docs/superpowers/specs/2026-08-17-tenancy-ui-design.md` (spec 3 of 4). **Written as a design brief** — behaviour, states, data and copy are specified; visual and layout decisions are deliberately left to the design step that follows.

**The principle:** a tenancy is the continuous relationship; a lease is a specific contract within it. Each lease keeps its own page and stays its own source of truth — there is no merged "giant lease" view — but the user must never have to discover the lineage by hand. **The interface never says "financial account"**; the landlord's concepts are *this lease* and *the whole tenancy*.

**The renewal wizard was missing from the original scope and is the most important part.** `POST /v1/.../leases/{lease_id}/renew` shipped in RENTL-55 with no caller, so today a renewal can only be created with curl — including the three real ones waiting on it. The wizard reuses the existing move-in wizard's steps (`AskDate`, `AskDuration`, `TermBar`, `TenancySummary`, `useUnitAvailability`) rather than reimplementing them: a renewal is a move-in for a new term. On success it offers the existing `CollectDialog` pre-filled with the new term's charges, so no new payment UI is built.

**The Renew button is disabled with a tooltip, never hidden** — a PM who expects to renew and finds nothing has no way to learn why.

**Lineage is a column, not row grouping.** The lease list is a sortable, filterable, paginated DataTable; grouping holds only while unsorted and unfiltered, and a chain spanning a page boundary renders as orphans. A Lineage column ("Original" / "Renewal of 260732XOK3") survives every sort, filter and page, and the full chain lives on the lease page.

**The Financials tab is deliberately unchanged this release.** The This Lease / Entire Tenancy toggle is deferred, and "just always filter to this lease" is specifically what is *not* being done: the security deposit carries the lease it was taken under, and account-level credits and write-offs carry no lease at all, so a strict filter would hide both from a renewal's view — and the account-wide totals would stop matching the list with nothing to explain why. For a single-term tenancy, which is nearly all of them today, the account view is already identical to "this lease".

**Closure moved to spec 4** (DRAFT-35). It releases a tenant's deposit; mixing a creation flow with a money-releasing flow in one spec makes both harder to review.

No new API work: spec 1 and spec 2 shipped every field and endpoint this needs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A renewal wizard at /properties/:propertyId/occupancy/leases/:leaseId/renew collects term, rent and optional unit, reusing the move-in wizard's steps rather than reimplementing them
- [ ] #2 The Renew action is disabled with a tooltip naming the reason (pending lease, already renewed, not renewable) — never hidden
- [ ] #3 move_in_date defaults to the parent's move_out_date, and an earlier date is refused client-side with the same reason the API gives
- [ ] #4 carry_financial_account is offered only when the unit is changed, phrased without naming the account, matching the API rejecting it on a same-unit renewal
- [ ] #5 On success the wizard offers Record payment, opening the existing CollectDialog pre-filled with the new term's charges — no new payment UI
- [ ] #6 The lease list carries a Lineage column reading Original or Renewal of <code>, linking to the parent, surviving sort, filter and pagination
- [ ] #7 The lease page shows a chain strip beneath the header on every tab, with the current term marked and the others navigable
- [ ] #8 The Financials tab is UNCHANGED this release — no lease filter and no toggle, so the deposit and account-level credits stay visible and the totals keep matching the list
- [ ] #9 useRenewLease exists in app/api/leases — the only client-side API work needed
- [ ] #10 b1-approve-to-lease.spec.ts no longer reads the removed account.lease_id, and the stale doc comment in types/lease.d.ts is corrected
- [ ] #11 All new UI is verified in both dark and light mode
<!-- AC:END -->
