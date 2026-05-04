# Short-Term Bookings — Frontend Design Spec

**Date:** 2026-05-04
**Status:** Approved
**Scope:** Property Manager portal (property manager app) + public pages (website app)
**Depends on:** `docs/superpowers/specs/2026-04-22-short-term-bookings-design.md` (approved), backend Plan 1 complete

---

## Context

The backend booking engine (Plan 1) adds `Booking`, `UnitDateBlock`, and property `modes` to the API. This spec covers the two frontend surfaces:

- **Plan 2 — Property Manager App** (`apps/property-manager`): wizard step, conditional sidebar, booking CRUD, availability calendar
- **Plan 3 — Website App** (`apps/website`): public guest booking page + booking tracking page

---

## Decisions Made

| Question | Decision |
|---|---|
| Public booking page layout | Single-page scroll, two-column (Airbnb-style). Sticky booking summary on the right. |
| Availability calendar layout | Calendar-first: full-width month grid, color-coded blocks by type. Click block to view/delete. |
| Mode selection UI | Visual radio cards added to Step 0 of the property creation wizard (no new step). |
| Mode selection placement | Inline in existing Step 0 alongside property type and status. |
| Availability data fetching | Per-month: refetch blocks when the manager navigates to a new month. |
| All Tenants tab visibility | Always visible — used for both lease tenants and booking guests. |

---

## Part 1 — Property Manager App

### 1.1 Types

**Modify `apps/property-manager/types/property.d.ts`:**

Add to the `Property` interface:
```ts
modes: Array<'LEASE' | 'BOOKING'>
booking_requires_upfront_payment: boolean
```

**New `apps/property-manager/types/booking.d.ts`:**

```ts
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED'
type BookingSource = 'MANAGER' | 'GUEST_LINK'
type BlockType = 'BOOKING' | 'LEASE' | 'MAINTENANCE' | 'PERSONAL' | 'OTHER'

interface Booking {
  id: string
  code: string
  tracking_code: string
  check_in_code: string        // only populated when status is CONFIRMED+
  unit_id: string
  unit: PropertyUnit
  property_id: string
  tenant_id: string
  tenant: Tenant
  check_in_date: Date
  check_out_date: Date
  rate: number                 // smallest currency unit
  currency: string
  status: BookingStatus
  cancellation_reason: string
  notes: string
  booking_source: BookingSource
  requires_upfront_payment: boolean
  created_by_client_user_id: Nullable<string>
  invoice_id: Nullable<string>
  invoice: Nullable<Invoice>
  created_at: Date
  updated_at: Date
}

interface UnitDateBlock {
  id: string
  unit_id: string
  start_date: Date
  end_date: Date
  block_type: BlockType
  booking_id: Nullable<string>
  lease_id: Nullable<string>
  reason: string
  created_at: Date
}

interface FetchBookingFilter {
  status?: BookingStatus
  unit_id?: string
}
```

---

### 1.2 Property Creation Wizard — Mode Selection

**File modified:** `apps/property-manager/app/modules/properties/new/steps/step0.tsx`

Mode selection is added as a third field in Step 0 — no new step, no step count change.

- Uses the same `Item` / `ItemGroup` pattern already in Step 0 for property type selection
- Three radio-card options: **Long-term (Leases)**, **Short-term (Bookings)**, **Both**
  - "Both" maps to `modes: ['LEASE', 'BOOKING']`
- `modes` field added to `CreatePropertyInput` in `app/api/properties/index.ts`
- Zod schema for Step 0 extended with `modes: z.enum(['LEASE', 'BOOKING', 'BOTH'])`
- On submit, `'BOTH'` is expanded to `['LEASE', 'BOOKING']` before calling `updateFormData`
- Step 3 (review screen) shows the selected mode in the property type & status card

---

### 1.3 Property Sidebar — Conditional Navigation

**File modified:** `apps/property-manager/app/modules/properties/property/layout/sidebar.tsx`

Navigation items gated by `clientUserProperty.property.modes`:

```
Always shown:
  Overview
  Assets (Blocks, Units, Facilities)
  All Tenants                          ← always visible (booking guests + lease tenants)
  Activities (Maintenance, Announcements, Inspections, Polls)
  Financials (Invoices, Expenses, Reports)
  Settings

When modes includes "LEASE":
  Tenants → Applications
  Tenants → Leases

When modes includes "BOOKING":
  Bookings → Bookings list
  Bookings → Availability
```

The existing `Tenants` nav group becomes `{ title: 'Tenants', url: '/tenants', items: [...alwaysVisible, ...leaseOnly] }` where lease-only items carry `isHidden: !modes.includes('LEASE')`.

Bookings nav group URLs: `/properties/:id/bookings` (list) and `/properties/:id/availability`.

---

### 1.4 New Routes — Property Manager

All routes live under `apps/property-manager/app/routes/`.

#### Booking List
**Route:** `_auth.properties.$propertyId.bookings._index.tsx`
**Module:** `modules/properties/property/bookings/index.tsx`

- DataTable of bookings for the property, sorted by `created_at desc`
- Status filter tabs: All / Pending / Confirmed / Checked-in / Completed / Cancelled (implemented as URL search param `?status=`)
- "New Booking" button → navigates to `.../bookings/new`
- Columns: Code, Guest name, Unit, Status badge, Check-in date, Check-out date, Rate
- Populated relations: `Tenant`, `Unit`
- Data: `useGetPropertyBookings` TanStack Query hook

#### New Booking Form
**Route:** `_auth.properties.$propertyId.bookings.new.tsx`
**Module:** `modules/properties/property/bookings/new/index.tsx`

Full-page form. React Hook Form + Zod. Fields:
- Unit selector (dropdown of property's units)
- Check-in date / Check-out date (date pickers)
- Rate (number input, pre-filled from selected unit's `rent_fee`)
- Currency (pre-filled from unit)
- Notes (optional textarea)
- Guest section: First name, Last name, Phone, Email, ID number

On submit: `POST /v1/admin/clients/:clientId/properties/:propertyId/bookings`. On success, navigate to the new booking's detail page.

#### Booking Detail
**Route:** `_auth.properties.$propertyId.bookings.$bookingId.tsx`
**Module:** `modules/properties/property/bookings/booking/index.tsx`

SSR loader (`server.ts` + route loader) pre-fetches the booking. Layout follows the existing lease detail pattern:

- **12-col grid: sidebar (`col-span-12 lg:col-span-4`) + main (`col-span-12 lg:col-span-8`)**
- **Sidebar:** Booking code, status badge, guest name + phone + email, check-in/check-out dates, total amount. If status is `CONFIRMED` or later: 5-digit check-in code shown prominently. Action buttons: Confirm (PENDING), Check-in (CONFIRMED), Complete (CHECKED_IN), Cancel (any except COMPLETED) — each guarded by `MANAGER` permission.
- **Main area:** Booking details card (unit link, dates, rate breakdown, notes), invoice link if present, cancellation reason if cancelled.

#### Availability Calendar
**Route:** `_auth.properties.$propertyId.availability.tsx`
**Module:** `modules/properties/property/availability/index.tsx`

- Unit selector dropdown (defaults to first unit of the property)
- Full-width month grid calendar built with `react-day-picker` v9
  - Blocked date ranges rendered as colored `modifiers` by block type:
    - `BOOKING` → blue (`#dbeafe`)
    - `LEASE` → green (`#dcfce7`)
    - `MAINTENANCE` → yellow (`#fef9c3`)
    - `PERSONAL` → purple (`#f3e8ff`)
    - `OTHER` → grey (`#f1f5f9`)
  - Clicking a blocked range opens a detail popover (type, reason, dates, delete button for manual blocks)
- Data fetching: `useGetUnitAvailability(unitId, from, to)` — `from`/`to` are the first/last day of the currently displayed month. Refetches when the month changes via `onMonthChange` callback.
- **"Block Dates" button** opens a Sheet (side panel) with:
  - Date range picker (start/end)
  - Block type selector (MAINTENANCE / PERSONAL / OTHER)
  - Reason text field (optional)
  - Submit calls `POST /v1/admin/clients/:clientId/units/:unitId/date-blocks`
- Delete: calls `DELETE /v1/admin/clients/:clientId/date-blocks/:blockId` — only available on MAINTENANCE / PERSONAL / OTHER blocks (BOOKING and LEASE blocks cannot be deleted directly)

#### Unit Detail Addition
**File modified:** unit detail module

For booking-mode properties, show a copyable public booking link below the unit info:
```
rentloopapp.com/book/<property-slug>/<unit-slug>
```
Shown only when `clientUserProperty.property.modes.includes('BOOKING')`.

---

### 1.5 API Layer — `app/api/bookings/`

**`index.ts` — client-side TanStack Query hooks:**

```ts
// Queries
useGetPropertyBookings(clientId, propertyId, query)   // list with filters
useGetBooking(clientId, bookingId, initialData?)       // detail

// Availability
useGetUnitAvailability(clientId, unitId, from, to)    // blocks for date range

// Mutations
useCreateBooking()           // POST .../properties/:id/bookings
useConfirmBooking()          // PUT .../bookings/:id/confirm
useCheckInBooking()          // PUT .../bookings/:id/check-in
useCompleteBooking()         // PUT .../bookings/:id/complete
useCancelBooking()           // PUT .../bookings/:id/cancel
useCreateDateBlock()         // POST .../units/:id/date-blocks
useDeleteDateBlock()         // DELETE .../date-blocks/:id
```

**`server.ts` — SSR fetch:**

```ts
getBookingForServer(bookingId, apiConfig)   // for the detail page loader
```

**Query key:** `QUERY_KEYS.BOOKINGS` added to `app/lib/constants.ts`.

---

## Part 2 — Website App

### 2.1 Public Booking Page

**Route:** `apps/website/app/routes/book.$propertySlug.$unitSlug.tsx`
**Module:** `apps/website/app/modules/bookings/book/index.tsx`

**Layout:** Single-page scroll, two-column on `lg+` screens.

**Left column:**
1. Unit photos (image gallery or single hero image)
2. Unit name, property name, description
3. Rate display: `GH₵ X,XXX / night` (or per-day label from unit's rent_fee)
4. `react-day-picker` range calendar:
   - Availability fetched on load via `GET /api/v1/public/units/:slug/availability` (3-month window from today)
   - Blocked date ranges rendered as disabled/greyed modifiers — cannot be selected
   - Guest clicks to select check-in then check-out
5. Guest info form (only shown after dates are selected):
   - First name, Last name, Phone, Email, ID number
   - React Hook Form + Zod validation

**Right column (sticky `top-8`):**
- Booking summary card:
  - Selected check-in / check-out
  - Number of nights
  - Rate × nights = total
  - "Request Booking" button (disabled until dates + all fields valid)
- On submit: `POST /api/v1/public/units/:slug/bookings`
- On success: summary card replaced with confirmation message — "Booking request submitted. Track your booking: [link to tracking page]"
- On error: inline error in the summary card

**SSR loader:** Fetches unit + property details server-side (name, images, description, rate, slug). No auth required.

**SEO:** Exports `meta` function using `getSocialMetas()` with unit name and property in title.

**Sitemap:** Added to `apps/website/app/routes/sitemap[.]xml.tsx` — `priority: '0.8'`, `changefreq: 'monthly'`.

---

### 2.2 Booking Tracking Page

**Route:** `apps/website/app/routes/bookings.track.$trackingCode.tsx`
**Module:** `apps/website/app/modules/bookings/track/index.tsx`

**Phone gate (initial state):**
- Single input: phone number
- "Find my booking" button
- On submit: `GET /api/v1/public/bookings/track/:trackingCode?phone=<phone>`
  - `200` → show booking details
  - `403` → show "No booking found for this phone number"
- No real OTP — the backend matches the phone directly against the booking's guest record

**Booking details view (post-verification):**
- Status progress bar: Pending → Confirmed → Checked-in → Completed (active step highlighted)
- Unit name, property name
- Check-in / check-out dates
- Total amount
- If status is `CONFIRMED`, `CHECKED_IN`, or `COMPLETED`: 5-digit check-in code shown in a large, prominent box
- Property contact email (from the booking's property record, if present)

**Sitemap:** Excluded — requires a tracking code, not a search engine target.

---

## File Map

### New files

**Property Manager App:**
```
apps/property-manager/types/booking.d.ts
apps/property-manager/app/api/bookings/index.ts
apps/property-manager/app/api/bookings/server.ts
apps/property-manager/app/routes/_auth.properties.$propertyId.bookings._index.tsx
apps/property-manager/app/routes/_auth.properties.$propertyId.bookings.new.tsx
apps/property-manager/app/routes/_auth.properties.$propertyId.bookings.$bookingId.tsx
apps/property-manager/app/routes/_auth.properties.$propertyId.availability.tsx
apps/property-manager/app/modules/properties/property/bookings/index.tsx
apps/property-manager/app/modules/properties/property/bookings/new/index.tsx
apps/property-manager/app/modules/properties/property/bookings/booking/index.tsx
apps/property-manager/app/modules/properties/property/availability/index.tsx
```

**Website App:**
```
apps/website/app/routes/book.$propertySlug.$unitSlug.tsx
apps/website/app/routes/bookings.track.$trackingCode.tsx
apps/website/app/modules/bookings/book/index.tsx
apps/website/app/modules/bookings/track/index.tsx
```

### Modified files

**Property Manager App:**
```
apps/property-manager/types/property.d.ts            — add modes, booking_requires_upfront_payment
apps/property-manager/app/api/properties/index.ts    — add modes to CreatePropertyInput
apps/property-manager/app/modules/properties/new/steps/step0.tsx  — add mode selection field
apps/property-manager/app/modules/properties/new/steps/step3.tsx  — show modes in review
apps/property-manager/app/modules/properties/property/layout/sidebar.tsx  — conditional nav
apps/property-manager/app/modules/index.ts           — export new modules
apps/property-manager/app/lib/constants.ts           — add QUERY_KEYS.BOOKINGS
```

**Website App:**
```
apps/website/app/routes/sitemap[.]xml.tsx            — add booking page route
```

---

## Verification

1. Create a property selecting "Short-term (Bookings)" mode. Confirm sidebar shows Bookings and Availability, not Applications or Leases. All Tenants still visible.
2. Create a property selecting "Both". Confirm all tabs appear.
3. Create a booking via New Booking form. Confirm it appears as PENDING in the list.
4. Confirm the booking from the detail page. Confirm 5-digit check-in code appears.
5. Go to Availability tab. Select a unit, verify blocked dates appear color-coded. Add a maintenance block, verify it appears on the calendar. Delete it.
6. Visit the public booking page. Select dates, fill guest info, submit. Confirm success message with tracking link.
7. Visit the tracking link. Enter the guest phone. Confirm booking details appear. After manager confirms, verify check-in code is visible.
8. Verify dark mode on all new property manager UI.
9. Verify `yarn types:check` passes with no errors.
