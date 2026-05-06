# Booking UI Revamp Design

**Date:** 2026-05-05
**Scope:** `apps/website/app/modules/bookings/book/` and its route `book.$propertySlug.$unitSlug.tsx`

---

## Overview

Revamp the guest-facing booking page from a functional but unpolished layout into a clean, minimal, premium-feeling experience. The two-column layout is retained; everything inside it is improved.

**Confirmed decisions:**
- Layout: Improved single page (not wizard, not split panel)
- Images: Hero + grid gallery (Airbnb-style)
- Visual style: Clean & minimal (white, zinc, fine borders, generous spacing)
- Success state: Celebratory modal with confetti animation

---

## Architecture

No structural changes to data fetching or API calls. All changes are in the presentation layer:

```
app/modules/bookings/book/
├── index.tsx                    # BookModule — layout shell
└── components/
    ├── image-gallery.tsx        # NEW — replaces inline <img>
    ├── availability-calendar.tsx # UPDATED — skeleton loader + styled DayPicker
    ├── guest-info-form.tsx      # UPDATED — always visible, style polish
    ├── booking-summary.tsx      # UPDATED — polish, spinner, error style
    └── success-modal.tsx        # NEW — replaces inline success card
```

---

## Section 1 — Overall Layout

The `BookModule` keeps its 2-col grid (`lg:col-span-2` left, `lg:col-span-1` right sticky). Changes:

- Left column sections: gallery → unit info → calendar → guest form (always rendered)
- Right column: sticky `BookingSummary`
- Success modal renders as a portal overlay on top of everything
- `selectedRange && !success` conditional on `GuestInfoForm` is removed — form is always visible

---

## Section 2 — Image Gallery (`image-gallery.tsx`)

New component replacing the current `<img>` strip in `index.tsx`.

**Layout:** CSS grid, 2 columns, 2 rows. First slot spans both rows (hero). Remaining 4 slots fill the grid.

```
┌─────────────┬──────┬──────┐
│             │  2   │  3   │
│      1      ├──────┼──────┤
│   (hero)    │  4   │  5   │
└─────────────┴──────┴──────┘
```

**Rules:**
- If `images.length === 0`: render nothing (no placeholder)
- If `images.length === 1`: render full-width hero only (no grid)
- If `images.length 2–4`: hero + available thumbnails, empty grid cells hidden (`hidden`)
- If `images.length >= 5`: last thumbnail slot shows `"+N photos"` chip overlay where N = `images.length - 5`
- Container: `rounded-xl overflow-hidden` — rounded corners on outer corners only
- Hero image height: `h-72 lg:h-80`, thumbnails: `h-36 lg:h-40`, all `object-cover w-full h-full`
- No lightbox in v1 — images are not clickable

**Props:**
```ts
interface Props {
  images: string[]
  altPrefix: string  // e.g. unit name, for alt text
}
```

---

## Section 3 — Unit Info & Pricing

No component change — stays inline in `BookModule`. Style improvements only:

- `h1` unit name: `text-2xl font-bold tracking-tight text-zinc-900`
- Property name: `text-sm text-zinc-500 mt-0.5`
- Description: `text-sm text-zinc-600 leading-relaxed mt-3`
- Price: `text-xl font-semibold text-zinc-900 mt-4` with a frequency label (e.g. "/ night") in `text-sm font-normal text-zinc-400`

**Payment frequency label:** Use `unit.payment_frequency` to drive the label rather than hardcoding "night". Map the uppercase enum values:
```
DAILY       → "night"
WEEKLY      → "week"
MONTHLY     → "month"
QUARTERLY   → "quarter"
BIANNUALLY  → "6 months"
ANNUALLY    → "year"
```

---

## Section 4 — Availability Calendar (`availability-calendar.tsx`)

Two changes:

**1. Skeleton loader:**
Replace the `"Loading availability..."` text with a shimmer skeleton:
```tsx
// While loading:
<div className="animate-pulse rounded-xl bg-zinc-100 h-64 w-full" />
```

**2. Styled DayPicker:**
Override `react-day-picker` CSS custom properties (or use the `classNames` prop) to match the clean theme:
- Selected range fill: `rose-100` bg, `rose-600` text
- Range start/end: `rose-600` bg, white text, fully rounded
- Hover: `zinc-100` bg
- Disabled dates: `zinc-300` text, `line-through`
- Today indicator: `rose-600` dot underline
- Remove the default blue/purple accent entirely

Use `classNames` prop on `DayPicker` to inject Tailwind classes — avoid global CSS overrides.

---

## Section 5 — Guest Info Form (`guest-info-form.tsx`)

**Behavioral change:** Form is always rendered (conditional removed from `BookModule`). Submit is still gated on `canSubmit` (requires both dates and valid form).

**Style polish:**
- Section heading: `text-base font-semibold text-zinc-900`
- Labels: `text-sm font-medium text-zinc-700 mb-1`
- Inputs: `rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent w-full transition`
- Error messages: `text-xs text-red-500 mt-1`
- Grid layout: unchanged (`grid-cols-1 sm:grid-cols-2`, ID number `sm:col-span-2`)

No changes to schema or validation logic.

---

## Section 6 — Booking Summary (`booking-summary.tsx`)

**Removed:** The inline success card (moved to `SuccessModal`). `BookingSummary` no longer handles `success` or `trackingCode` — those props are dropped.

**Updated props:**
```ts
interface Props {
  unit: PropertyUnit
  selectedRange: { from: Date; to: Date } | null
  canSubmit: boolean
  submitting: boolean
  error: string | null
  onSubmit: () => void
}
```

**Style polish:**
- Card: `rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm`
- Date/nights rows: cleaner label/value alignment with `text-zinc-400` labels, `text-zinc-900 font-medium` values
- Divider: `border-zinc-100`
- Price breakdown: `text-zinc-400` for the formula, `font-semibold text-zinc-900` for total
- Error: `flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600` with a small `⚠` icon

**CTA button loading state:**
Replace "Submitting..." text with an inline SVG spinner + "Requesting...":
```tsx
{submitting ? (
  <span className="flex items-center justify-center gap-2">
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
    Requesting...
  </span>
) : 'Request Booking'}
```

---

## Section 7 — Success Modal (`success-modal.tsx`)

New component. Rendered inside `BookModule` when `success === true`.

**Structure:**
- Backdrop: fixed inset-0, `bg-black/40 backdrop-blur-sm`, z-50
- Modal: centered, `max-w-sm w-full mx-4`, white, `rounded-2xl p-8 shadow-xl`
- Scale-in animation: CSS `@keyframes` or Tailwind `animate` — modal enters at `scale-95 opacity-0` → `scale-100 opacity-100` over 200ms

**Modal content (top to bottom):**
1. Confetti burst — CSS-only: 6–8 small colored `<span>` elements, absolutely positioned, animating outward from center with `@keyframes` (translate + fade). Colors: rose, amber, emerald, sky. No JS confetti library.
2. Large emoji or checkmark icon: `text-4xl` centered
3. Heading: `"You're booked!"` — `text-xl font-bold text-zinc-900`
4. Subtext: `"The property manager will review your request and confirm shortly."` — `text-sm text-zinc-500 mt-2`
5. Tracking code pill: `bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 mt-4` with `TRACKING CODE` label (`text-xs text-zinc-400 uppercase tracking-wider`) and the code in `font-mono font-bold text-zinc-900 text-lg`
6. Primary CTA: `<Link to="/bookings/track/{trackingCode}">` — rose-600, full-width, `rounded-lg py-2.5 mt-4`
7. Dismiss link: `"Close"` — `text-sm text-zinc-400 underline mt-3 block text-center cursor-pointer` — calls `onClose` which sets `success = false` in parent

**Props:**
```ts
interface Props {
  trackingCode: string
  onClose: () => void
}
```

**`BookModule` changes:** Track `success` and `trackingCode` state as before. When `success === true`, render `<SuccessModal>` instead of passing success props into `BookingSummary`.

---

## Error Handling

- API errors: displayed in `BookingSummary` error slot (unchanged logic)
- Availability fetch errors: calendar silently shows an empty (all-available) state — no change from current behavior
- Missing images: gallery renders nothing (no broken image states)

---

## What Is Not Changing

- Route file (`book.$propertySlug.$unitSlug.tsx`) — no changes
- API calls (`createBooking`, `getUnitAvailabilityForClient`) — no changes
- Form schema and validation (`guestSchema`) — no changes
- Loader and meta functions — no changes
- `react-day-picker` library — kept, just styled differently
