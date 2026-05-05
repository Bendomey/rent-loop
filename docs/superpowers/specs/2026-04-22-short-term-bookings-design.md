# Short-Term Bookings — Design Spec

**Date:** 2026-04-22  
**Status:** Approved  
**Scope:** Booking engine, availability calendar, guest model, public booking page, guest tracking page

---

## Context

Rent-Loop currently supports only long-term rental management via the Lease model. Property managers create tenant applications, sign agreements, and generate recurring invoices. This flow is too heavy for short-term stays (nightly/daily bookings).

This feature introduces a parallel **Booking** mode alongside the existing Lease mode, letting property owners manage short-term stays (think: furnished apartments, serviced units, vacation rentals) without touching the existing lease infrastructure.

**Guiding constraint:** The existing Lease flow must not be changed. Bookings are additive.

---

## Scope (v1)

In scope:
- Property mode selection (lease / booking / both)
- Booking model + lifecycle
- Availability calendar per unit (booked dates + manual blocks)
- Manager-created bookings
- Guest self-service booking via a shareable public link per unit
- Guest booking tracking page (phone-verified)
- 5-digit check-in code generated on confirmation

Out of scope (deferred):
- Cleaning schedules
- Check-in/out instructions
- Access codes
- Guest search/discovery
- Mobile app integration for bookings

---

## Property Mode

### Data Change

Add `modes` field to the `Property` model — a PostgreSQL text array.

```
Property.Modes []string  // values: "LEASE", "BOOKING"
// e.g. ["LEASE"], ["BOOKING"], ["LEASE","BOOKING"]
```

- **Migration:** Backfill all existing properties with `["LEASE"]`
- **Default for new properties:** set during creation wizard; no default assumed

### UnitDateBlock Backfill (Migration)

As part of the migration, create `UnitDateBlock` records for all currently active (and pending) leases:

- `BlockType = LEASE` (add this as a new enum value alongside BOOKING | MAINTENANCE | PERSONAL | OTHER)
- `StartDate = lease.MoveInDate`
- `EndDate` = calculated from `MoveInDate + (StayDuration × StayDurationFrequency)`, or open-ended if the lease has no fixed end date
- `BookingID = null`, `LeaseID = lease.ID` (add `LeaseID` nullable FK to `UnitDateBlock`)
- `Reason = "Active lease"`

This ensures the availability calendar is accurate for mixed-mode properties from day one. Going forward, new leases created on LEASE+BOOKING properties should also create a corresponding `UnitDateBlock` at activation time.

### UI Behavior

| Modes | Tabs shown in property manager |
|-------|-------------------------------|
| `["LEASE"]` | Existing: Applications, Leases, Tenants |
| `["BOOKING"]` | New: Bookings, Availability |
| `["LEASE","BOOKING"]` | All of the above |

---

## Data Models

### Booking

```
Booking
├── ID              uuid, primary key
├── Code            string, unique, auto-generated (e.g. "BKG-2504ABC")
├── TrackingCode    string, unique, auto-generated at creation (used in tracking URL)
├── CheckInCode     string (5-digit numeric), generated on CONFIRMED status
├── UnitID          uuid, FK → Unit
├── PropertyID      uuid, FK → Property
├── TenantID        uuid, FK → Tenant (reused model, subset of fields populated)
├── CheckInDate     date
├── CheckOutDate    date
├── Rate            int64 (smallest currency unit; calculated as unit.RentFee × frequency count set by booking agent)
├── Currency        string
├── Status          enum: PENDING | CONFIRMED | CHECKED_IN | COMPLETED | CANCELLED
├── CancellationReason  string, nullable
├── Notes           string, nullable (manager notes)
├── BookingSource   enum: MANAGER | GUEST_LINK
├── RequiresUpfrontPayment  bool (copied from property setting at booking time)
├── CreatedByClientUserID   uuid, nullable (set for MANAGER source)
├── InvoiceID       uuid, nullable, FK → Invoice
├── Meta            JSONB, extensible
├── CreatedAt, UpdatedAt, DeletedAt
```

### UnitDateBlock

Tracks all blocked date ranges per unit (both automatic from bookings and manual).

```
UnitDateBlock
├── ID              uuid, primary key
├── UnitID          uuid, FK → Unit
├── StartDate       date
├── EndDate         date
├── BlockType       enum: BOOKING | LEASE | MAINTENANCE | PERSONAL | OTHER
├── BookingID       uuid, nullable (set when BlockType=BOOKING)
├── LeaseID         uuid, nullable (set when BlockType=LEASE)
├── Reason          string, nullable (for manual blocks)
├── CreatedByClientUserID   uuid, nullable, FK → ClientUser (null for system-created booking/lease blocks)
├── CreatedAt, UpdatedAt, DeletedAt
```

**Double-booking prevention:** Before confirming a booking, query for any `UnitDateBlock` where the unit ID matches and date ranges overlap. If found, reject the confirmation.

### Tenant (no new model)

Reuse existing `Tenant` model. For guests, populate only: `FirstName`, `LastName`, `Phone`, `Email`, `IDNumber`. All other fields remain null.

### Property (addition)

Add `BookingRequiresUpfrontPayment bool` field — configurable per property, applies to all its booking-mode units.

---

## Booking Lifecycle

```
PENDING → CONFIRMED → CHECKED_IN → COMPLETED
                ↘                ↘
              CANCELLED         CANCELLED
```

| Transition | Actor | Side Effects |
|-----------|-------|-------------|
| Created → PENDING | Manager or Guest | Booking record created; tracking link sent to guest |
| PENDING → CONFIRMED | Manager | `UnitDateBlock` created; `CheckInCode` generated; invoice created; guest notified |
| CONFIRMED → CHECKED_IN | Manager | Timestamp recorded |
| CHECKED_IN → COMPLETED | Manager | Unit status freed |
| Any → CANCELLED | Manager | `UnitDateBlock` removed (if existed); cancellation reason recorded; guest notified |

---

## API Endpoints

### Client User (Authenticated — Manager)

```
POST   /api/client-user/properties/:id/bookings           Create booking (on behalf of guest)
GET    /api/client-user/properties/:id/bookings           List bookings (filterable by status, date range, unit)
GET    /api/client-user/bookings/:id                      Booking detail
PUT    /api/client-user/bookings/:id/confirm              Confirm pending booking
PUT    /api/client-user/bookings/:id/check-in             Mark checked in
PUT    /api/client-user/bookings/:id/complete             Mark completed
PUT    /api/client-user/bookings/:id/cancel               Cancel with reason

POST   /api/client-user/units/:id/date-blocks             Create manual date block
DELETE /api/client-user/date-blocks/:id                   Remove date block
GET    /api/client-user/units/:id/availability            Get availability for date range
```

### Public (Unauthenticated)

```
GET    /api/public/units/:slug/availability               Availability calendar for date range
POST   /api/public/units/:slug/bookings                   Guest creates booking
GET    /api/public/bookings/track/:trackingCode           Booking status (after phone verification)
POST   /api/public/bookings/track/:trackingCode/verify    Verify phone OTP to access tracking page
```

---

## Frontend — Property Manager App

### Property Creation Wizard (Step Addition)

New step added to the property creation wizard (`apps/property-manager/app/routes/_auth._dashboard.properties.new/`):

- Question: "What type of rentals does this property handle?"
- Options: Long-term (Leases) / Short-term (Bookings) / Both

### Conditional Navigation

Property detail navigation adapts based on `modes`:

- `LEASE` in modes → show Applications, Leases, Tenants tabs (unchanged)
- `BOOKING` in modes → show Bookings tab + Availability tab (new)

### New Routes (Property Manager)

```
_auth.properties.$propertyId.bookings._index.tsx          Booking list with status filters
_auth.properties.$propertyId.bookings.new.tsx             New booking form (manager-created)
_auth.properties.$propertyId.bookings.$bookingId.tsx      Booking detail + status actions
_auth.properties.$propertyId.availability.tsx             Availability calendar + manual block controls
```

### Unit Detail Addition

For booking-mode units, the unit detail page shows:
- Copyable public booking link: `rentloop.com/book/<property-slug>/<unit-slug>`

---

## Frontend — Website App

### Public Booking Page

**Route:** `/book/:propertySlug/:unitSlug`

Sections:
1. Unit details: name, photos, description, features, rate (unit RentFee + frequency)
2. Availability calendar (read-only — shows available / blocked dates)
3. Date picker: check-in and check-out selection
4. Guest info form: first name, last name, phone, email, ID number
5. Payment step (shown only if `BookingRequiresUpfrontPayment=true`)
6. Confirmation screen: "Your booking request has been submitted. We'll notify you once confirmed. Track your booking: [link]"

### Booking Tracking Page

**Route:** `/bookings/track/:trackingCode`

Access flow:
1. Guest enters their phone number
2. OTP sent to that phone
3. OTP verified → if phone matches booking's guest phone, show booking details
4. If phone doesn't match, show "no booking found for this number"

Content shown:
- Booking status with visual progress indicator (pending → confirmed → checked-in → completed)
- Unit name, property, check-in/check-out dates
- Total amount and payment status
- **If CONFIRMED or later:** 5-digit check-in code displayed prominently
- Property contact info

The tracking link is sent to the guest by SMS/email when the booking is first created (PENDING status).

---

## Double-Booking Prevention

Critical path for `confirm` action:

1. Load all `UnitDateBlock` records for the unit where `DeletedAt IS NULL`
2. Check if any block overlaps with `[booking.CheckInDate, booking.CheckOutDate)`
3. If overlap found → reject with `409 Conflict`, return conflicting dates
4. If clear → create `UnitDateBlock` (BlockType=BOOKING) + update booking status atomically in a transaction

---

## Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Booking created (PENDING) | SMS + email | Guest — includes tracking link |
| Booking confirmed | SMS + email | Guest — includes check-in code |
| Booking cancelled | SMS + email | Guest — includes reason |
| New booking received | In-app | Manager |

---

## Key Files to Change

**Backend (`services/main`):**
- `internal/models/property.go` — add `Modes` field
- `internal/models/property.go` — add `BookingRequiresUpfrontPayment` field
- `internal/models/booking.go` — new file
- `internal/models/unit-date-block.go` — new file
- `internal/services/booking.go` — new file (booking lifecycle logic)
- `internal/services/lease.go` — update lease activation to create a `UnitDateBlock` (BlockType=LEASE)
- `internal/handlers/booking.go` — new file (API handlers)
- DB migrations — properties.modes column, bookings table, unit_date_blocks table, backfill UnitDateBlocks from active/pending leases

**Frontend — Property Manager (`apps/property-manager`):**
- `app/routes/_auth._dashboard.properties.new/` — add mode selection step
- `app/routes/_auth.properties.$propertyId.*` — conditional nav, new booking routes
- `app/types/property.d.ts` — add modes field
- `app/types/booking.d.ts` — new file
- `app/api/bookings/` — new API integration folder

**Frontend — Website (`apps/website`):**
- `app/routes/book.$propertySlug.$unitSlug.tsx` — new public booking page
- `app/routes/bookings.track.$trackingCode.tsx` — new tracking page

---

## Verification

1. **Property mode** — Create a new property, select "Booking" mode. Confirm Bookings tab appears, Leases tab does not.
2. **Availability** — Go to Availability tab, create a manual maintenance block. Confirm it appears on the calendar.
3. **Manager booking** — Create a booking via New Booking form. Confirm it appears as PENDING.
4. **Confirm booking** — Confirm the booking. Verify `UnitDateBlock` created, `CheckInCode` generated, invoice created.
5. **Double-booking** — Try to confirm a second booking for the same dates. Verify 409 rejection.
6. **Guest booking link** — Copy the public link for a booking-mode unit. Visit it as a guest, select dates, submit guest info. Verify booking appears as PENDING in manager dashboard.
7. **Tracking page** — Visit tracking link, verify phone OTP gate works. After verifying correct phone, confirm booking details shown. After manager confirms, verify 5-digit code appears.
8. **Cancellation** — Cancel a confirmed booking. Verify `UnitDateBlock` removed, dates become available again.
