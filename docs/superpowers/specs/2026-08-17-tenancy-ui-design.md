# Tenancy UI — Design Brief

**Status:** Designed. Ready for visual design, then planning.
**Date:** 2026-08-17, designed 2026-08-18.
**Depends on:** spec 1 (`2026-08-11-lease-renewal-financial-account-design.md`)
and spec 2 (`2026-08-17-lease-renewal-api-design.md`). Both are implemented —
every field and endpoint this brief needs already exists.
**Task:** `RENTL-56`

**This document is a brief, not a layout.** It states behaviour, states, data
and copy, and deliberately leaves visual design open. Component and layout
decisions belong to the design step that follows.

---

## The principle

**A tenancy is the continuous relationship. A lease is a specific contract
within it.**

Each lease keeps its own page and remains its own source of truth — a renewal
genuinely has its own dates, terms, rent, charges, unit, documents and status.
There is no merged "giant lease" view. But the user must never have to discover
the lineage by hand.

**The interface never says "financial account."** That is an implementation
concept. The landlord's concepts are *this lease* and *the whole tenancy*.

---

## Scope

| In | Out |
|---|---|
| The renewal wizard | Account closure and deposit release — **spec 4** (`DRAFT-35`) |
| Lineage in the lease list | The This Lease / Entire Tenancy toggle — deferred, see §4 |
| Lease History on the lease page | A separate tenancy page or second list |
| | Anything requiring new API work |

Closure was moved out deliberately: it releases a tenant's deposit, and mixing
a creation flow with a money-releasing flow in one spec makes both harder to
review.

---

## 1. The renewal wizard

Today `POST /v1/.../leases/{lease_id}/renew` exists with no caller. Until this
ships, a renewal can only be created with curl.

**Route:** `/properties/:propertyId/occupancy/leases/:leaseId/renew`

**Entry point:** a **Renew** action in the lease header.

It is **disabled with a tooltip, never hidden.** A PM who expects to renew and
finds nothing has no way to learn why. The tooltip names the reason:

| Condition | Tooltip |
|---|---|
| Lease is Pending | "A pending lease has nothing to renew yet" |
| Lease is Cancelled or Terminated | "Only an active or completed lease can be renewed" |
| A non-cancelled child exists | "This lease has already been renewed" |

Both facts — status and whether a renewal exists — are already on the lease the
page has loaded, so the button never offers what the API would refuse.

### Steps

The move-in wizard (`modules/.../applications/application/move-in/`) already
solves most of this and should be reused rather than reimplemented: a renewal
is a move-in for a new term.

| Step | Collects | Existing pieces |
|---|---|---|
| **Term** | move-in date, duration | `AskDate`, `AskDuration`, `DurationStepper`, `TermBar` |
| **Rent & unit** | rent (defaults to the parent's), unit (defaults to the parent's) | `useUnitAvailability` |
| **Review** | nothing — confirms the new term beside the old | `TenancySummary`, `buildSchedule` / `termEndDate` |

**Move-in defaults to the parent's `move_out_date`.** The continuous renewal is
the common case, and it is the only value guaranteed to satisfy the API's
`RenewalOverlapsParentTerm` guard. An earlier date is refused client-side with
the same reason the API gives.

**A unit change is allowed, and the money always follows.** The wizard sends
`carry_financial_account: true` on a move and does not ask. The API rejects the
flag outright on a same-unit renewal, so it is sent only on a move.

This was originally a question put to the PM, with an option to start the new
room on a fresh balance. That option is withdrawn: splitting a tenancy's money
across two ledgers mid-renewal is not something anyone asked for, and choosing
it by mistake strands a deposit on a room nobody lives in. The API keeps the
capability; the wizard no longer surfaces it.

The move is still stated in the summary — *"Their money · Carries over"* —
because it is the one thing a PM would wonder about on a room change. Stated,
not asked.

### After creation

The wizard's final state offers **"Record payment"**, which opens the existing
`CollectDialog` pre-filled with the new term's charges — filtered by the
renewal's `lease_id`, a one-parameter change against spec 1's charge filter.

This matters because two of the three real renewals are paid at signing. It is
one flow to the PM, but adds no new payment UI: one place still owns how money
is collected.

### States a design must cover

- A renewal that will be paid immediately, and one that will not
- A same-unit renewal and a unit change — neither asks about the money
- A parent with no financial account — legitimate when charges were never
  prepared. The renewal is still created; there is simply nothing to collect
- Server-side guard failures surfacing after submission, since another user may
  renew the same lease first

---

## 2. Lineage in the lease list

The list is a sortable, filterable, paginated `DataTable`. Grouping rows by
tenancy was considered and rejected: it holds only while the table is unsorted
and unfiltered, a chain spanning a page boundary renders as orphans, and the
paginated endpoint does not fetch whole chains.

Instead, **a Lineage column**:

- `Original` — no parent
- `Renewal of 260732XOK3` — linking to the parent lease

It survives every sort, filter and page. The full chain lives on the lease page,
where there is room for it.

Data: `type` and `parent_lease_id`, both already on the lease response.

---

## 3. Lease History on the lease page

A compact chain strip beneath the lease header, **visible on every tab** — it is
identity and navigation, not a detail, and it matters most on Financials where
the tenancy view lives.

Each term shows its dates and status; the current one is marked; the others are
navigable to their own pages.

### States a design must cover

- **A single-term tenancy** — the common case today. The strip should be absent
  or minimal rather than showing a chain of one
- **Two terms** — the ordinary renewal
- **A long chain** — several renewals; it must not crowd the header
- **A chain containing a Cancelled renewal** — one that was superseded before it
  began. It is part of the history and should read as ended, not current

---

## 4. Financials: unchanged this release

**The This Lease / Entire Tenancy toggle is deferred.** The Financials tab keeps
showing the whole account — list and totals agreeing, exactly as it does today.

This is a deliberate deferral rather than an oversight, and "just always filter
to this lease" is specifically what is *not* being done:

- **The deposit would vanish.** Spec 1 keeps a `SECURITY_DEPOSIT` charge on the
  lease it was taken under, which is historical truth. Filter a renewal's tab
  strictly by its own `lease_id` and the PM stops seeing the deposit they are
  holding.
- **Account-level charges would vanish too.** Credits, write-offs and
  cross-term adjustments carry no `lease_id` at all — that is what NULL means.
- **The figures would stop matching the list.** `MoneyHero` is account-wide by
  design. The toggle was what made a filtered list legible; without it the
  numbers simply disagree with what is on screen and nothing explains why.

Scoping the totals per lease instead is not an option: spec 1 rejected it
outright. Payments allocate against charges with no lease reference, so a
per-term total is not the tenant's real balance.

For a single-term tenancy — nearly all of them today — the account view is
already identical to "this lease", so nothing is lost by waiting.

The `lease_id` filter stays available in the API, unused by the client until
the toggle ships. When it does, the rule it must hold to is that **the toggle
filters the list and never the totals**.

---

## 5. Data and API layer

Everything needed already exists server-side. New client work:

- `useRenewLease` mutation in `app/api/leases`

That is the whole of it. The `lease_id` charge parameter is **not** needed this
release, since the Financials tab is unchanged (§4).

### Carried over from spec 1

Two items the shared-account change created, neither blocking:

- `apps/property-manager/e2e/specs/b1-approve-to-lease.spec.ts` reads
  `account.lease_id` to build a URL. That field is gone from the API response,
  so the spec fails — point it at the lease's own id.
- `apps/property-manager/types/lease.d.ts:57-62` documents `financial_account`
  as coming from `financial_accounts.lease_id`. Stale wording only; the field
  still populates, resolved the other way round now.

---

## Constraints

Per the root `CLAUDE.md`: every change supports dark and light mode using
Tailwind `dark:` variants and the existing CSS variables (`bg-background`,
`text-foreground`), verified in both before the work is considered complete.

---

## Why this unblocks production

The three real renewals — Paul Richardson (Room 6), Jenelle Mustapha (Room 7)
and Daniel Paintsil (Room 1) — are waiting on this. Spec 2 shipped the endpoint;
without the wizard they can only be created by hand against the API.

Paul's and Jenelle's are paid at signing, which is exactly the wizard's
record-payment path. Daniel's is unpaid and is left for the issuance sweep —
with his billing cadence checked first, as spec 2 records.
