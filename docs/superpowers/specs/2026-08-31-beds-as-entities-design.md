# Beds as Entities — Problem Statement

**Status:** Parked. **Framed, not designed.** This document records why the
question exists and what has to be answered before it can be. It contains no
approved decisions and nothing here should be built from.
**Date:** 2026-08-31.
**Related:** `2026-08-19-scheduled-leases-availability-design.md`, whose open
question 2 this expands. RENTL-48 (maintenance multi-asset targeting) is the
other flow that wants bed identity.
**Task:** unfiled.

---

## Where this comes from

The availability spec models occupancy as a **count**: `slots_occupied` on a
block, summed by a boundary sweep against `Unit.MaxOccupantsAllowed`. That is
deliberately enough for availability, because availability only ever asks *how
many* beds are taken on a given day, never *which*.

Counting is the right answer to that question and this document does not
propose replacing it. The question here is different: **which flows need to
name a bed, and is that enough to justify beds existing?**

---

## What counting already handles

Do not re-solve these:

- Is this unit free on these dates — the sweep answers exactly, per day.
- Can a shared room take one more tenant — `UnitHasCapacity`
  (`internal/services/renewal.go:124`), consumed at `renewal.go:185`,
  `renewal.go:433` and `tenant-application.go:1375`.
- Does a booking and a lease co-exist in a two-bed room — yes, both write
  `slots_occupied = 1` and the sweep does not care which is which.

A bed model that only made these work differently would be pure cost.

---

## What identity would buy

Four flows currently cannot express something a PM can say out loud. Whether
four is enough is the decision this document defers.

| Flow | Cannot say today |
|---|---|
| Manual date blocks | "the top bunk is broken" — the availability spec ships `slots_occupied` but no UI, precisely because a count cannot name the bed being held |
| Maintenance (RENTL-48) | a request targets a UNIT or a BLOCK; a broken bunk is logged against the whole room |
| Pricing | `Unit.RentFee` is per unit; a room where the window bed costs more than the corner bed has no representation |
| The tenant | a tenant in a four-bed room is assigned to the room, not to a place in it — nothing to show them, nothing to hand over |

---

## The shape a design would take

Sketch only, to make the open questions legible — not a proposal.

A `Bed` belongs to a `Unit`. `Lease`, `Booking` and `UnitDateBlock` gain an
optional reference to one. Capacity stops being
`Unit.MaxOccupantsAllowed`, an integer typed by a PM, and becomes the count of
beds that exist. The availability sweep's arithmetic becomes set cardinality
over the same boundaries — the availability spec was written so this
substitution does not disturb it.

The word "bed" is doing double duty already and a design must pick: a physical
bed, or a lettable slot in a unit. A studio has one slot and no bunk; an office
has slots and no beds at all. The entity is probably not called `Bed`.

---

## Open questions

None of these are answered. They are the reason this is parked rather than
planned.

1. **Is a bed a slot or a thing?** A lettable position in a unit, or a physical
   asset that can be broken, replaced and moved? Maintenance wants the second;
   availability only needs the first. Choosing the second and using it for the
   first is the expensive direction, and choosing the first closes the door on
   RENTL-48 ever targeting a bunk.
2. **What does `MaxOccupantsAllowed` become?** Derived from bed count, kept as
   an independent ceiling, or dropped. It is `not null default:1` on every
   existing unit and three services read it. A unit whose capacity was left at
   the default while housing two tenants is already a known data problem
   (availability spec §7) and this migration inherits it.
3. **Do existing leases, bookings and blocks get assigned beds?** Every one of
   them currently names only a unit. Backfilling means inventing assignments
   nobody made; leaving them null means every consumer handles "occupies a bed,
   but we do not know which" forever.
4. **Are beds optional per unit?** Most units are whole-unit lets where beds
   are noise. If beds are optional, every read path carries both models
   permanently. If mandatory, single-let units grow a phantom bed each.
5. **Who creates them, and when?** Unit creation, a separate setup step, or
   lazily on first per-bed action. This decides whether the feature is
   something a PM opts into or something the product asserts.
6. **Does pricing move to the bed?** `Lease.RentFee` and `Unit.RentFee` are
   both per-unit today, and RENTL-51 is separately reworking financial
   accounts across a tenancy. Per-bed pricing should not be designed across
   that work while it is in flight.

---

## Not in scope when this is picked up

- Any change to how availability counts. `slots_occupied` and the sweep are
  forward-compatible by construction; a bed model replaces the count with a
  set and the boundaries are unchanged.
- Retrofitting bed identity onto historical leases or bookings for reporting.
- Room layouts, floor plans, or anything positional beyond identity.

---

## Before this is designed

The availability work (`2026-08-19-scheduled-leases-availability-design.md`)
ships first, including the `max_occupants_allowed` production audit it calls
for in §7. That audit is the input to question 2 — there is no point choosing
what capacity becomes while nobody knows what the column currently says.
