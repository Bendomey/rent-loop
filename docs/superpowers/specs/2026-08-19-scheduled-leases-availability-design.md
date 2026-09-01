# Scheduled Leases and Real Availability — Design

**Status:** Designed. Not scheduled. **Do not implement inside the lease
renewal branch** — this is picked up after the renewal feature deploys.
**Date:** 2026-08-19.
**Related:** `2026-08-17-lease-renewal-api-design.md` (RENTL-55) and
`2026-08-17-tenancy-ui-design.md` (RENTL-56). This spec was written from a
gap those two exposed; neither depends on it.
**Task:** unfiled.

---

## The principle

**A lease claims its dates the moment it is created, not the day it starts.**

A Pending lease is a scheduled lease. The room is spoken for. Today the
system only records occupancy once a lease is activated, so the entire window
between approval and move-in is invisible to every other flow — and that
window is exactly where double-booking happens.

The corollary: **every flow that picks lease dates reads the same table.**
`unit_date_blocks` becomes the single answer to "is this room free then",
rather than each flow deriving its own answer from whatever it happens to
have loaded.

---

## Scope

| In | Out |
|---|---|
| Writing the block at lease creation | Any change to the booking flow's own writes |
| Keeping it correct on update, cancel, terminate | A calendar/timeline UI for blocks |
| A per-day, capacity-aware occupancy sweep | A UI for per-bed manual blocks — the column ships, the form field does not |
| Both date pickers reading real availability | Multi-unit or property-level availability |
| Backfilling Pending leases | Removing stale blocks from ended leases (harmless — see §7) |

---

## 1. Why blocks are not reservations today

`unit_date_blocks` was built for the booking feature — the short-stay
calendar. Leases were attached to it afterwards, as a record of current
occupancy rather than as a claim on dates. The code says so plainly:

- The only lease-side write is at `internal/services/lease.go:608`, inside
  `ActivateLease` — not `CreateLease`.
- Its comment reads *"for availability calendar"* and its reason string is
  `"Active lease"`.
- It runs in a fire-and-forget goroutine with the error discarded
  (`_, _ = s.unitDateBlockService.CreateSystemBlock(...)`).

The consequence is measurable on production data:

| Lease status | Leases | With a block |
|---|---|---|
| Active | 39 | 39 |
| Completed | 7 | 7 |
| Terminated | 3 | 3 |
| **Pending** | **10** | **2** |

Those two Pending blocks are residue from the backfill job
(`init/migration/jobs/backfill-unit-date-blocks-from-leases.go:39`), which
covered `status IN ('Pending','Active')`. The runtime path never has. So the
migration and the running system already disagree about when a block exists,
and eight scheduled leases currently claim nothing.

**One boundary detail makes the whole design work.** `HasOverlappingBlock`
(`internal/repository/booking.go:174`) compares half-open —
`start_date < ? AND end_date > ?`. A term beginning exactly on another's end
date does not overlap it. Back-to-back terms, which is what every renewal
is, need no special case.

---

## 2. Write side: block at creation

The write moves from `ActivateLease` to `CreateLease`
(`internal/services/lease.go:143`). Both `ApproveTenantApplication` and
`RenewLease` (`internal/services/renewal.go:202`) already route through
`CreateLease`, so one site covers every path that makes a lease.

Two properties change with the move:

- **It joins the transaction.** A discarded error is acceptable for a
  calendar hint and unacceptable for a reservation — a dropped write is a
  double-book. The goroutine goes; the block is written through
  `lib.ResolveDB` inside the lease transaction and its failure rolls the
  lease back.
- **The reason string stops claiming activity.** `"Active lease"` is wrong
  for a lease that has not started. Use the lease code, matching the booking
  side's `"System block for booking #%s"`.

`ActivateLease` stops writing. The existing unique index —
`idx_unit_date_blocks_unit_lease ON (unit_id, lease_id) WHERE lease_id IS NOT
NULL AND deleted_at IS NULL` — makes a stray double-write impossible rather
than merely unlikely, so the removal is safe in either order.

---

## 3. Lifecycle: three hooks that do not exist

A block written at creation must track the lease it belongs to. Today
nothing in `lease.go` ever deletes or amends a block.

| Event | Today | Required |
|---|---|---|
| `UpdateLease` changes move-in date or duration (`lease.go:252-265`, mutable while Pending) | block, if any, keeps the old dates | move the block with the term |
| `CancelLease` | block persists | release the dates — a cancelled lease claims nothing |
| `TerminateLease` | block runs to the original end date | truncate to the actual end, or the room stays claimed through a term the tenant has already left |

`CancelLease` is the one that matters most for renewals: the tenancy UI
treats a cancelled renewal as a superseded term, and a superseded term must
not hold a room.

---

## 4. Occupancy is a per-day count, not a per-window one

Once leases write blocks, lease creation can check them the way
`ConfirmBooking` does at `internal/services/booking.go:449`.

**`HasOverlappingBlock` cannot be reused.** It answers "does any block
overlap", and `Unit.MaxOccupantsAllowed` (`internal/models/unit.go:39`)
makes that the wrong question. A two-bed unit holding one lease has one
block and a free bed; a boolean check refuses the second tenant.
`useUnitAvailability` documents having fallen into exactly this trap once —
*"Counting leases without consulting capacity declared every shared unit
occupied until its first tenant left."*

**But counting blocks across the whole requested window is also wrong**, and
wrong in the direction that refuses valid work. Occupancy is not constant
across a term. A six-month lease into a two-bed room might overlap a
fortnight's booking in March and a departing tenant through January — three
blocks touch the window, yet no single day carries more than one. Counting
per window sees three and refuses. The room was free the whole time.

**A day is unavailable when the blocks covering that day reach capacity.**
That is the rule, and every other statement in this spec derives from it.

### Scope belongs to the block, not to its type

Two independent questions, and they must not be conflated. *How much* a block
occupies is its **scope**. *What happens* when a new term meets a saturated
day is the guard's response (§4, "One sweep, two consumers"). This section is
only about scope.

A shared room must be able to have a single bed blocked — one bunk broken in
a four-bed room does not close the room. So scope cannot be inferred from
`block_type`: the same `MAINTENANCE` block is absolute in one room and
one bed in another, decided by the person creating it. Hard-coding it per
type means the sweep special-cases `MAINTENANCE` forever and every new block
type reopens the question.

**`UnitDateBlock` gains `SlotsOccupied *int`.**

| Value | Means | Sweep behaviour |
|---|---|---|
| `NULL` | absolute — the block holds the whole unit | set the running count to capacity |
| `n` | the block holds `n` beds | increment the running count by `n` |

| Type | Writes | Because |
|---|---|---|
| `LEASE` | `1` | one tenancy, one bed |
| `BOOKING` | `1` | **a booking is not an absolute hold.** A short stay takes a bed, not the building — a two-bed room can carry one booking and one lease at the same time |
| `MAINTENANCE`, `PERSONAL`, `OTHER` | `NULL` | see below — the model supports beds, the UI does not yet offer them |

A booking and a lease draw from the same pool of beds and are counted
identically — the sweep does not care which is which, only that a bed is
taken.

### The UI stays absolute for now

`CreateDateBlock` (`internal/handlers/booking.go:586`) accepts
`slots_occupied` and defaults it to `NULL` when absent. **The date-block UI
does not expose it and always creates absolute holds.** A PM blocking dates
today gets exactly today's behaviour.

This is deliberate: the column is the seam, not the feature. Per-bed manual
blocking needs a UI that can express *which* bed and a story for what happens
when capacity later shrinks below the blocks outstanding — neither is worth
designing before anyone has asked for it. Building the seam now costs one
nullable column and keeps the sweep uniform; retrofitting it later would mean
migrating live blocks whose scope was implicit.

When it does ship, the only change is the form field. The sweep, the guard
and the pickers already handle both cases from day one, and should be tested
against both even while the UI can only produce one.

### Response is the same either way

A saturated day refuses, whatever saturated it. A lease does not get to
override a booking on the grounds that a year is worth more than a weekend —
that puts the system in the business of ranking one confirmed commitment
above another. A PM who wants the lease cancels the booking first, in the
flow that owns bookings.

### One sweep, two consumers

Both the guard and the picker need the same thing: the spans where occupancy
reaches capacity. A boundary sweep gives both in one pass.

1. Take every block overlapping the requested range, **excluding the lease's
   own renewal chain**.
2. Emit `(start_date, +1)` and `(end_date, -1)` for each; sort by date.
3. Walk them, carrying a running count. A block with `slots_occupied = n`
   increments by `n`; a block with `slots_occupied = NULL` sets the count to
   capacity outright.
4. The spans where the count is at or above `max_occupants_allowed` are the
   **saturated ranges**.

The guard refuses when the requested term intersects any saturated range.
The picker disables exactly those ranges. Same function, same answer — which
is the point. Blocks per unit number in the tens, so the sweep is cheaper
than the query that fetches them, and no `generate_series` over days is
needed to be exact.

**The chain exclusion is required, not defensive.** A same-unit renewal
overlaps nothing of its parent's (§1's half-open boundary), but a chain of
three terms in one room must not have term two refuse term three. Exclude by
walking `parent_lease_id`, the lineage the tenancy UI already builds.

**The guard stays a separable task.** It is the only part of this spec that
makes creation *fail* where it succeeds today. §2, §3 and §5 add truth
without adding refusals, and can ship without it.

---

## 5. Read side: the pickers

`GET /api/v1/.../units/{unit_id}/availability?from&to` already exists
(`internal/router/client-user.go:180`) and returns raw blocks with
`start_date`, `end_date`, `block_type`, `lease_id` and `booking_id`. **No new
endpoint is needed, but the response gains a computed field.**

The sweep of §4 must run **server-side**, and the endpoint must return its
saturated ranges alongside the raw blocks:

- It needs `max_occupants_allowed` and the full block set together — the
  client has neither reliably.
- Implementing it twice, in Go for the guard and TypeScript for the picker,
  guarantees the two drift. The picker would then offer dates the API
  refuses, which is the exact failure this spec exists to remove.

The endpoint also takes an **`exclude_lease_id`** parameter, so a renewal can
ask about a room without its own chain counting against it.

This replaces `use-unit-availability.ts`, which derives availability from the
lease list client-side. That hook has three problems the endpoint does not:

- **It cannot see anything but leases.** A unit under a confirmed booking or
  a maintenance block reads as free to the lease flow. This is the gap that
  motivated the change.
- **It is capped at `per: 20`.** A unit with more than twenty historical
  leases silently loses rows from the calculation.
- **It returns one date, not a shape.** `{ freeFrom, occupant }` can gate a
  picker's floor but cannot express "free, then busy for a fortnight, then
  free again" — precisely what a shared room with a short booking looks like.

Saturated ranges feed the `disabled` predicate both pickers already accept:

| Flow | File | Today |
|---|---|---|
| Tenant application move-in | `modules/.../applications/application/move-in/index.tsx` | `AskDate` floored by `freeFrom` |
| Renewal | `modules/.../leases/lease/renewal/index.tsx` | `DatePickerInput` with `startMonth` / `endMonth` / `disabled`, floored at the parent's end |

Both keep their existing floors — a renewal still cannot start before its
parent ends. Saturation is an additional constraint, never a looser one.

**A term is a range, and the picker only disables its start.** Choosing a
free start date does not guarantee the whole term clears; a date picked
just before a saturated span produces a term that the guard will refuse.
The duration step must re-check the resulting term against the same ranges
and say so at the point the duration is chosen, not at submission.

### States a design must cover

- A free room — no saturated ranges, nothing disabled, and the picker must
  not look different from today
- A room free from a date, the ordinary "sitting tenant leaves in March" case
- A room with a hole in the middle — a short booking between two free spans.
  The current hook cannot represent this at all
- A shared room below capacity: blocks exist, no range is saturated, and
  every date stays selectable. Blocks alone must never grey out a date
- A shared room where a booking and a lease together reach capacity, so a
  span *is* saturated despite the room never being wholly held by either
- A renewal into its own room, where the tenant's own chain must not appear
  as an obstacle
- A start date that is free but whose term runs into a saturated span
- Availability still loading, and availability failing to load. Failing open
  keeps today's behaviour and lets the server guard catch it; failing closed
  blocks a PM from working. Prefer failing open with the reason visible

---

## 6. Backfill

A gormigrate job in the shape of the existing backfill
(`init/migration/jobs/backfill-unit-date-blocks-from-leases.go`), selecting
**every lease with no block row regardless of status**, rather than filtering
on `status IN ('Pending','Active')` the way the original job did.

The practical delta today is still the eight Pending leases — §1's counts show
Active, Completed and Terminated already at full coverage. Selecting on the
missing row instead of the status buys the job independence from those counts
staying true, and catches anything the original run's `ON CONFLICT DO NOTHING`
dropped.

**`Lease.Status.Cancelled` is the one exclusion.** §3 has `CancelLease`
release the dates; backfilling a cancelled lease would manufacture the exact
claim the runtime is being changed to remove.

**Terminated leases need an end date the original job cannot produce.** That
job derives `end_date` from `move_in_date + stay_duration` for every row. For
a lease ended early that writes a block running to the *original* term end — a
live claim on a room the tenant has already left, which is what §3's truncate
rule exists to prevent. Unlike the stale past blocks of §7, which never
overlap a future window, an overstated terminated block sits inside future
windows and will make the §4 guard refuse valid leases. So `end_date` becomes
status-dependent: `Terminated` takes the actual end (`leases.terminated_at`,
or the `LeaseTermination` record's effective date), everything else keeps the
duration-derived value. Completed leases ran to term, so the two agree there.

**Trap:** `AutoMigrate` runs *before* the gormigrate job list in this repo,
so a job may add rows but must not rename a column or add a NOT NULL one to a
populated table. This is why `SlotsOccupied` is `*int` and nullable: the table
is populated, and `NULL` already carries the meaning those rows need —
absolute.

`slots_occupied` still gets its own `ADD COLUMN IF NOT EXISTS` job, per this
repo's convention for every added column (`AddLeaseMoveOutDate`,
`AddTenantCode`, and the rest). AutoMigrate would also add it, but the backfill
job below *writes* the column, and that dependency should be an ordered job
rather than an implicit reliance on AutoMigrate having run first. The column
job is registered immediately before the backfill.

---

## 7. Risks and things deliberately not done

- **Stale blocks on ended leases are left alone.** All ten Completed and
  Terminated leases still hold blocks, and nothing removes them. They are
  harmless: a block carries its own date range, and a past term never
  overlaps a future window. Deleting them would be tidying, not fixing.
- **The guard changes behaviour app-wide.** Once lease creation reads blocks,
  a confirmed booking can refuse a lease. That is the intent (§4), but it is
  a new failure mode for a flow PMs use daily, and it deserves its own
  release note rather than arriving silently.
- **A refusal has no override.** The guard refuses outright; there is no
  proceed-anyway path. A PM who knows the block is wrong — the tenant left
  early, the booking fell through — resolves it in the flow that owns the
  block: cancel the booking, terminate the lease, delete the manual block.
  The refusal message should say which block stands in the way so that route
  is obvious, or the failure reads as a bug.
- **Capacity is trusted.** The sweep is only as correct as
  `max_occupants_allowed`, which defaults to 1 and has never gated anything
  before. A unit whose capacity was left at the default while housing two
  tenants will start refusing its second lease. Worth auditing the column on
  production before the guard ships.
- **Truncating on termination is a judgement call.** Early termination frees
  the room in the system the moment it is recorded, which is right, but a
  room is rarely re-lettable the same day. Truncating to the actual end date
  is the honest model; any notice period belongs to the PM, not the schema.
- **No calendar UI.** Blocks become correct and readable, but nothing in this
  spec shows a PM the whole picture of a room's year. That is worth building
  and is not this.

---

## Constraints

- Per the root `CLAUDE.md`: all UI supports dark and light mode via Tailwind
  `dark:` variants and the existing CSS variables, verified in both.
- Swagger godoc annotations updated on every handler touched.
- An e2e scenario in `services/main/scripts/e2e/cases/` covering the
  scheduled-lease claim and the capacity-aware refusal, with `./run-all.sh`
  green before the work is called done.

---

## Open questions for planning

1. **Beds become real entities later.** Counting is deliberately enough for
   this spec: availability only ever asks *how many* beds are taken, never
   which. Modelling beds as entities — so a block, a lease or a booking names
   the bunk it occupies — is intended future work, not a gap being overlooked.
   `slots_occupied` is forward-compatible with it: a per-bed model replaces
   the count with a set, and the sweep's arithmetic becomes set cardinality
   over the same boundaries.

Settled during design: a `BOOKING` occupies one slot rather than the whole
unit; scope is carried by `slots_occupied` on the block rather than inferred
from `block_type`; manual blocks default to absolute and the UI offers no
alternative in this release; and a saturated day refuses outright rather
than warning — the guard is a hard refusal, matching `ConfirmBooking`, with
no override or proceed-anyway path.
