# Lease Renewal API and Lease Lineage — Design

**Status:** Designed. Ready to plan.
**Date:** 2026-08-17, designed 2026-08-18.
**Depends on:** `2026-08-11-lease-renewal-financial-account-design.md` (spec 1),
which is implemented and rehearsed. Nothing here can be built until the
shared-account schema is live.
**Task:** `RENTL-55`

---

## Core idea

A renewal is a **new lease that continues an existing tenancy**. It gets its own
term, its own rent and its own charges, but it inherits the money relationship
its parent belonged to.

Everything below follows from that, and from spec 1's rule that accounts are
shared along a renewal chain rather than by tenant and property.

```
  parent lease            renewal
  Active                  Pending
  ├── move_out ───────────► move_in
  │                        │
  └──────── one financial account ────────┘
```

---

## The endpoint

```
POST /v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/renew
```

Role: **property `MANAGER`**, via
`ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")` — the same guard
`PATCH /leases/{id}`, `status:active` and `status:cancelled` already use on this
route group. Not global ADMIN/OWNER: renewing is a property-scoped operation,
and the sibling routes settled that question already.

**Body**

| Field | Required | Notes |
|---|---|---|
| `move_in_date` | yes | must not precede the parent's `move_out_date` |
| `stay_duration` | yes | |
| `stay_duration_frequency` | yes | |
| `rent_fee` | no | defaults to the parent's |
| `unit_id` | no | defaults to the parent's; see *Unit changes* |
| `carry_financial_account` | no | only meaningful when the unit changes |
| `lease_agreement_document_url` | no | |

Currency is deliberately **not** accepted. Spec 1 Rule 2 makes it immutable for
the account's life, and the cleanest enforcement is not offering it.

Billing cadence is **not** accepted either — see *Why cadence is absent*.

**Response:** the created lease, same shape as the approval endpoint returns.

---

## What it writes

One transaction:

1. The child lease — `status = Pending`, `type = RENEWAL`, `parent_lease_id`
   set, inheriting `tenant_id`, `rent_fee_currency`, `payment_frequency` and
   `tenant_application_id` from the parent.
2. `leases.financial_account_id` — the parent's account, or a new one.
3. The parent's `ChargeDefinition` rows closed (`Status = CLOSED`), and new
   definitions opened, scoped to the child lease at the new rent.
4. Rent instances materialised for the new term, each carrying the child's
   `lease_id`.
5. The destination unit's occupancy status recomputed — count Pending/Active
   after insert, compare to `max_occupants_allowed`, land on `Occupied` or
   `PartiallyOccupied`, exactly as `ApproveTenantApplication` does. On a
   same-unit renewal this is a no-op, since the unit is already occupied by
   the parent; it earns its place on a unit change.

**Not written here: the availability block.** `ActivateLease` already creates
the `unit_date_blocks` LEASE row (`lease.go:580-594`), so the renewal gets one
when the sweep activates it — which is also the moment it should appear. A
Pending renewal deliberately does not block the calendar: if there is a gap
between the terms, the unit genuinely is available in that window.

**Not written here: freeing the source unit on a move.** `CompleteLease` calls
`releaseUnitIfNoActiveLease`, which recounts and drops the old unit to
`Available` or `PartiallyOccupied` when the parent completes. A same-unit
renewal is unaffected: the remaining count still meets capacity, and the helper
returns without a change.

### The lease starts Pending, and the existing sweeps finish the job

The renewal is created `Pending` with `move_in_date` at (or after) the parent's
`move_out_date`. Two daily jobs that already exist then do the rest, with **no
new code**:

- `ListDueForActivation` selects `Pending` leases whose `move_in_date` has
  arrived and flips them `Active`.
- `ListDueForCompletion` selects `Pending` or `Active` leases whose
  `move_out_date` has passed and completes them.

So on the changeover day the parent completes and the renewal activates by
themselves.

**Why not create it Active**, as the manual script did: a renewal signed weeks
ahead would leave the unit with two Active leases for those weeks, occupancy
counting double, and the parent needing completion by hand.

**Cron ordering does not matter.** Both jobs run at `0 0 * * *` with no
guaranteed order, but `ActivateLease` checks only the lease's own status — it
has no occupancy guard — so activation cannot fail because the parent has not
completed yet. The worst case is a unit briefly counting two occupants on the
changeover day.

---

## Guards

Five, each a `400` with its own code.

| Code | Refuses when | Why |
|---|---|---|
| `ParentLeaseNotRenewable` | parent is not `Active` or `Completed` | `Pending` has nothing to renew; `Cancelled` never ran; `Terminated` ended early, which is a new tenancy rather than a continuation |
| `LeaseAlreadyRenewed` | the parent has a child that is not `Cancelled` | Stops the double-click and the double-run. A cancelled renewal deliberately does not block a retry |
| `RenewalOverlapsParentTerm` | `move_in_date` < parent's `move_out_date` | Overlap on one unit means the tenant holds it twice. A **gap** is allowed — a tenant may be away before returning |
| `UnitAtCapacityForTerm` | Pending/Active leases on the destination unit that overlap the new term, **excluding this chain**, reach `max_occupants_allowed` | Lets a renewal overlap its own parent while still blocking a move into a room someone else holds. Respects multi-occupant units rather than demanding an empty one |
| `RenewalUnitUnchangedForAccountFlag` | `carry_financial_account` is sent on a same-unit renewal | The flag is meaningless there; rejecting is better than ignoring |

The manual script's guard — *refuse if the unit has any Active or Pending
lease* — is deliberately **not** carried over. It only passed for the Gifty
renewal because that parent had already completed. Applied literally it would
reject every renewal signed before expiry, which is the normal case and all
three of the real ones.

**A parent with no financial account is not an error.** Charges may never have
been prepared; the renewal is then created without an account and materialises
nothing, mirroring what approval already does.

---

## Unit changes

A renewal may move the tenant to a different unit. The destination is guarded
by `UnitAtCapacityForTerm` above.

Whether the money follows is the PM's call, constrained so it is hard to get
wrong:

| Case | Behaviour |
|---|---|
| Same unit | Always carries the parent's account. The flag is rejected if sent |
| Unit changes, flag unset or `true` | Carries. The common case: one tenancy that changed rooms, so the deposit carries and arrears cross the move |
| Unit changes, flag `false` | A new account. The parent's becomes `CLOSURE_ELIGIBLE` when the parent completes, and the PM closes it — releasing the deposit through spec 1's existing flow. The new account starts with no deposit; one is charged explicitly if wanted |

Making the flag meaningless on a same-unit renewal removes most of the ways it
can be misused: it only appears where there is a genuine question.

### Reviving an eligible account

If the account being carried is `CLOSURE_ELIGIBLE` — the parent ended while the
renewal was still being negotiated — the renewal calls spec 1's `Revive` to
return it to `ACTIVE` and clear `closure_eligible_at`. Without that, a late
renewal would leave the tenancy attached to an account someone is being told is
ready to close.

---

## Financials

**Definitions.** The parent's are closed at its term end; new ones are opened
against the child lease at the new rent. Instances already generated keep their
historical amounts — there is no "amount changed" anywhere in this system.

**Materialisation** reuses `financials.MaterialiseRentInstances` unchanged. It
is a pure function over rent terms and does not know what a lease is; the only
new work is stamping `lease_id` on the drafts before they are persisted.

**No deposit charge, ever.** A renewal appends no `SECURITY_DEPOSIT`. If rent
rises and the deposit should follow, that is an explicit ad-hoc charge for the
**difference only**, through the endpoint that already exists. Automatic would
be the bug where a renewing tenant appears to owe another full deposit.

**One new piece of machinery:** `FinancialAccountService.OpenForLease`, for the
unit-change-without-carrying case. `PrepareCharges` is application-shaped and
cannot be reused. The new account inherits `OriginTenantApplicationID`,
`TenantID` and `Currency` from the parent's, takes the destination unit's
property, and starts on the account defaults.

### Why cadence is absent from the body

`RentBillingCadence` is account-level and derived once, by
`DeriveRentBillingPolicy(initial_deposit_fee, rent_fee)`, when charges are first
prepared. A renewal does not touch it, and does not need to:

`SelectIssuableCharges` skips any charge that is fully settled or fully
invoiced (`selection.go:42`), and its own comment records why —

> Selection is over state, never a stored cursor. That is what makes ad-hoc
> prepayment self-handling: settled and fully-invoiced charges simply stop being
> candidates.

So for a renewal paid in full at signing, the PM composes an invoice for the
term and records the payment; every charge leaves the candidate set and the
sweep issues nothing. The cadence is never consulted, whatever it says.

Cadence only shapes the **first invoice of an unpaid renewal**. If that
arrangement has changed, it is corrected through the existing
`PATCH /financial-accounts/{id}/billing-policy` — one place owns collection
policy, and it is not this endpoint.

---

## Prerequisites

**1. `CreateLease` must assign `ParentLeaseId`.** It is declared in
`CreateLeaseInput` and absent from the `models.Lease` literal in
`internal/services/lease.go`, so the link is silently dropped today. This is
precisely how lease `2608NHQ8DS` came to need a hand-written repair. One line.

**2. `Lease.Type`** — `ORIGINAL` | `RENEWAL`, defaulting to `ORIGINAL`, with a
non-destructive migration backfilling `RENEWAL` where `parent_lease_id IS NOT
NULL`. On current production data that is exactly one row.

The wider lineage enum — `EXTENSION`, `RENT_REVIEW`, `UNIT_CHANGE`,
`TENANT_CHANGE`, `TERMINATION` — stays deferred. Each raises its own
account-sharing question and none has a feature asking for it. The column is an
enum, so the rest can land later without a migration.

---

## The three real renewals

All three are at AdomBi Villa Apartment 2 Amasaman, all `Active`, all with
`ACTIVE` accounts and **zero outstanding** — clean starting points. All three
expire soon, so every one is the renew-before-expiry case this design is built
around.

| Lease | Tenant | Unit | Current term | Rent | Cadence | Renewal paid? |
|---|---|---|---|---|---|---|
| `26073GCL1V` | Paul Richardson | Room 6 | 2026-03-01 → **2026-09-01** (6mo) | 55,000 | `EVERY_N_PERIODS`/6 | Yes |
| `2607GV0VDZ` | Jenelle Mustapha | Room 7 | 2026-04-01 → **2026-10-01** (6mo) | 55,000 | `EVERY_N_PERIODS`/6 | Yes |
| `2607B8KCYF` | Daniel Paintsil | Room 1 | 2025-09-01 → **2026-09-01** (12mo) | 50,000 | `EVERY_N_PERIODS`/12 | **No** |

They are created through the endpoint after deploy — not by migration. They
have no lease rows yet, so this is the feature's first real use rather than a
backfill.

- **Paul and Jenelle**: renew, then settle through the existing
  compose-invoice → offline-pay flow. Their charges leave the sweep's candidate
  set immediately and cadence is irrelevant.
- **Daniel**: renew and leave outstanding. The daily issuance sweep bills him —
  which is the entire reason this cannot stay in a spreadsheet. **Check his
  cadence against what he has actually agreed to before his charges reach the
  sweep:** at `/12` he receives one invoice for the whole new term, about five
  days before it starts. Correct if he is again paying a year up front; wrong if
  he has moved to monthly, in which case update the billing policy first.

New terms and rents are supplied by the PM at the time. This spec does not
guess them.

---

## Testing

The guards are decidable without a database, so most of this is pure:

- `CanRenewParent(status)` — `Active` and `Completed` yes; `Pending`,
  `Cancelled`, `Terminated` no
- `HasBlockingRenewal(children)` — a `Cancelled` child does not block a retry
- `OverlapsParentTerm(moveIn, parentMoveOut)` — a gap is fine, an overlap is not
- Capacity arithmetic — occupancy excluding the chain, against
  `max_occupants_allowed`, including the multi-occupant case

**Repository test** for the capacity query, using the dry-run GORM handle
introduced in spec 1 (`internal/repository/charge_test.go`), which renders SQL
without a connection.

**E2E group `l`** — groups `a`–`k` are taken:

| Case | Covers |
|---|---|
| `l1-renew-shares-account` | Renewal is Pending, shares the parent's account, its charges carry the child's `lease_id`, and `?lease_id=` genuinely splits two terms |
| `l2-renewal-guards` | Second renewal refused, overlap refused, non-renewable parent refused, a cancelled child allows a retry |
| `l3-renew-then-sweep` | The lifecycle sweep activates the renewal and completes the parent; occupancy lands correctly; the issuance sweep bills an unpaid renewal |
| `l4-renew-into-another-unit` | Unit change, both account paths, and the destination-capacity guard |

`l1` also removes the `skip_case` currently in `j1` —
*"two terms on one account needs POST /leases/{id}/renew — spec 2"*. That skip
disappearing is the signal specs 1 and 2 have met.

---

## Rollout

Light. One non-destructive migration adding `leases.type` and backfilling it,
then a normal deploy. No destructive step and no coordinated release, so this
needs no runbook of its own.

Ordering: migrate, deploy, then create the three real renewals through the API.

Note that spec 1's own merge is gated on the tenancy UI (spec 3). This spec's
lineage data — `parent_lease_id` actually being populated, and `type`
distinguishing a renewal — is what the UI's grouped lease list and Lease History
timeline read, so spec 2 should land before or alongside that work rather than
after it.
