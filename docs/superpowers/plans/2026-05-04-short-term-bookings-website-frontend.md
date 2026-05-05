# Short-Term Bookings — Website Frontend Implementation Plan (Plan 3 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public guest booking page and a booking tracking page to the website app, allowing guests to request short-term stays and check their booking status without logging in.

**Architecture:** Two new public routes under `apps/website/` following the existing tenant-apply / tenant-track patterns. Each route has a thin route file (loader + meta + default module export) and a self-contained module under `app/modules/bookings/`. All API calls use `fetchClient` (client-side, no auth) and `fetchServer` (SSR loader, no auth). No TanStack Query — the website app is not wired to React Query; use React state + fetch directly on the client.

**Tech Stack:** React Router v7, React 19, TypeScript, react-day-picker v9 (already installed — used by the property manager app; check if the website app bundles it separately), Zod, React Hook Form, Tailwind CSS v4, Shadcn/Radix primitives mirrored from the property manager app.

---

## File Map

### New files

```
apps/website/types/booking.d.ts
apps/website/app/api/bookings/client.ts
apps/website/app/routes/book.$propertySlug.$unitSlug.tsx
apps/website/app/routes/bookings.track.$trackingCode.tsx
apps/website/app/modules/bookings/book/index.tsx
apps/website/app/modules/bookings/book/components/availability-calendar.tsx
apps/website/app/modules/bookings/book/components/guest-info-form.tsx
apps/website/app/modules/bookings/book/components/booking-summary.tsx
apps/website/app/modules/bookings/track/index.tsx
apps/website/app/modules/bookings/track/components/phone-gate.tsx
apps/website/app/modules/bookings/track/components/booking-details.tsx
```

### Modified files

```
apps/website/app/modules/index.ts                   — export new booking modules
apps/website/app/routes/sitemap[.]xml.tsx           — exclude booking page (dynamic slug, not crawlable without data)
```

> **Note on sitemap:** The booking page URL pattern (`/book/:propertySlug/:unitSlug`) requires real slugs to link to. We cannot enumerate all unit slugs statically, and listing them individually would require a backend call during sitemap generation. Per the spec decision ("Sitemap: Added … priority 0.8, changefreq monthly"), we will add a static placeholder entry comment explaining this and skip the route for now. The tracking page is already excluded per spec. If slug enumeration is added later, this is the place to add it.

---

## Task 1: Booking types for the website app

**Files:**
- Create: `apps/website/types/booking.d.ts`

- [ ] **Step 1: Create the booking type file**

```ts
// apps/website/types/booking.d.ts

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED'
type BlockType = 'BOOKING' | 'LEASE' | 'MAINTENANCE' | 'PERSONAL' | 'OTHER'

interface PublicBookingUnit {
  id: string
  name: string
  description: Nullable<string>
  images: Array<string>
  rent_fee: number
  rent_fee_currency: string
  slug: string
  property: PublicBookingProperty
}

interface PublicBookingProperty {
  id: string
  name: string
  slug: string
  contact_email: Nullable<string>
}

interface UnitDateBlock {
  id: string
  unit_id: string
  start_date: string
  end_date: string
  block_type: BlockType
  booking_id: Nullable<string>
  lease_id: Nullable<string>
  reason: string
  created_at: string
}

interface PublicBooking {
  id: string
  code: string
  tracking_code: string
  check_in_code: string
  check_in_date: string
  check_out_date: string
  rate: number
  currency: string
  status: BookingStatus
  cancellation_reason: Nullable<string>
  unit: PublicBookingUnit
}

interface CreatePublicBookingInput {
  check_in_date: string
  check_out_date: string
  first_name: string
  last_name: string
  phone: string
  email: string
  id_number: string
}
```

- [ ] **Step 2: Verify TypeScript accepts the file**

```bash
cd apps/website && yarn types:check 2>&1 | head -30
```

Expected: No new errors referencing `booking.d.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/website/types/booking.d.ts
git commit -m "feat: add booking types for website app"
```

---

## Task 2: API client for public booking endpoints

**Files:**
- Create: `apps/website/app/api/bookings/client.ts`

The website uses `fetchClient` (browser-side, no auth token needed) and `fetchServer` (SSR) from `~/lib/transport`. Public booking endpoints require no authentication.

- [ ] **Step 1: Create the API client file**

```ts
// apps/website/app/api/bookings/client.ts

import { fetchClient, fetchServer } from '~/lib/transport'

/**
 * Fetch blocked date ranges for a unit (public endpoint).
 * `from` and `to` are ISO date strings (YYYY-MM-DD).
 */
export async function getUnitAvailabilityForClient(
  unitSlug: string,
  from: string,
  to: string,
): Promise<UnitDateBlock[]> {
  const response = await fetchClient<ApiResponse<UnitDateBlock[]>>(
    `/v1/public/units/${unitSlug}/availability?from=${from}&to=${to}`,
    { isUnAuthorizedRequest: true },
  )
  return response.parsedBody.data ?? []
}

/**
 * SSR: Fetch unit + property info for the booking page.
 */
export async function getUnitForBookingPageServer(
  unitSlug: string,
  apiConfig: ApiConfigForServerConfig,
): Promise<PublicBookingUnit> {
  const response = await fetchServer<ApiResponse<PublicBookingUnit>>(
    `${apiConfig.baseUrl}/v1/public/units/${unitSlug}`,
    { isUnAuthorizedRequest: true },
  )
  return response.parsedBody.data
}

/**
 * Submit a guest booking request.
 */
export async function createPublicBooking(
  unitSlug: string,
  input: CreatePublicBookingInput,
): Promise<PublicBooking> {
  const response = await fetchClient<ApiResponse<PublicBooking>>(
    `/v1/public/units/${unitSlug}/bookings`,
    {
      method: 'POST',
      body: JSON.stringify(input),
      isUnAuthorizedRequest: true,
    },
  )
  return response.parsedBody.data
}

/**
 * Track a booking by tracking code + phone.
 * The backend matches the phone against the booking's guest record.
 * Returns 403 if the phone doesn't match.
 */
export async function trackBooking(
  trackingCode: string,
  phone: string,
): Promise<PublicBooking> {
  const encoded = encodeURIComponent(phone)
  const response = await fetchClient<ApiResponse<PublicBooking>>(
    `/v1/public/bookings/track/${trackingCode}?phone=${encoded}`,
    { isUnAuthorizedRequest: true },
  )
  return response.parsedBody.data
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/website && yarn types:check 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/api/bookings/client.ts
git commit -m "feat: add public booking API client for website"
```

---

## Task 3: Availability calendar component

**Files:**
- Create: `apps/website/app/modules/bookings/book/components/availability-calendar.tsx`

This renders a `react-day-picker` v9 range calendar with blocked dates shown as disabled/greyed modifiers. Guests click to select a check-in date then a check-out date.

First, check whether `react-day-picker` is already in the website app's `package.json`:

```bash
cat apps/website/package.json | grep react-day-picker
```

If missing, add it: `yarn workspace apps/website add react-day-picker`. The property manager app already uses v9 — use the same version.

- [ ] **Step 1: Check react-day-picker availability**

```bash
cat apps/website/package.json | grep react-day-picker
```

If the output is empty, run:

```bash
cd apps/website && yarn add react-day-picker@^9
```

Then verify: `yarn types:check 2>&1 | head -10`

- [ ] **Step 2: Create the availability calendar component**

```tsx
// apps/website/app/modules/bookings/book/components/availability-calendar.tsx

import { useState, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { addDays, format, startOfToday } from 'date-fns'
import { getUnitAvailabilityForClient } from '~/api/bookings/client'

interface Props {
  unitSlug: string
  onRangeSelect: (range: { from: Date; to: Date } | null) => void
  selectedRange: { from: Date; to: Date } | null
}

function blocksToDisabledDates(blocks: UnitDateBlock[]): Date[] {
  const dates: Date[] = []
  for (const block of blocks) {
    const start = new Date(block.start_date)
    const end = new Date(block.end_date)
    const cursor = new Date(start)
    while (cursor <= end) {
      dates.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return dates
}

export function AvailabilityCalendar({ unitSlug, onRangeSelect, selectedRange }: Props) {
  const today = startOfToday()
  const threeMonthsOut = addDays(today, 90)

  const [blocks, setBlocks] = useState<UnitDateBlock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getUnitAvailabilityForClient(
      unitSlug,
      format(today, 'yyyy-MM-dd'),
      format(threeMonthsOut, 'yyyy-MM-dd'),
    )
      .then((data) => {
        if (!cancelled) {
          setBlocks(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [unitSlug])

  const disabledDates = blocksToDisabledDates(blocks)

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onRangeSelect({ from: range.from, to: range.to })
    } else {
      onRangeSelect(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
        Loading availability...
      </div>
    )
  }

  return (
    <DayPicker
      mode="range"
      selected={selectedRange ?? undefined}
      onSelect={handleSelect}
      disabled={[
        { before: today },
        ...disabledDates.map((d) => ({ date: d })),
      ]}
      fromDate={today}
      toDate={threeMonthsOut}
      numberOfMonths={1}
    />
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/website && yarn types:check 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/website/app/modules/bookings/book/components/availability-calendar.tsx
git commit -m "feat: add availability calendar for public booking page"
```

---

## Task 4: Guest info form component

**Files:**
- Create: `apps/website/app/modules/bookings/book/components/guest-info-form.tsx`

Shown below the calendar only after the guest selects both check-in and check-out dates.

- [ ] **Step 1: Create the guest info form component**

```tsx
// apps/website/app/modules/bookings/book/components/guest-info-form.tsx

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const guestSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email'),
  id_number: z.string().min(1, 'Required'),
})

export type GuestFormValues = z.infer<typeof guestSchema>

interface Props {
  onValuesChange: (values: GuestFormValues | null) => void
}

export function GuestInfoForm({ onValuesChange }: Props) {
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    mode: 'onChange',
  })

  // Notify parent whenever form validity changes
  const values = watch()
  const lastValid = isValid ? values : null
  // Use useEffect to avoid calling during render
  import { useEffect } from 'react'
  useEffect(() => {
    onValuesChange(isValid ? values : null)
  }, [isValid, JSON.stringify(values)])

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-zinc-900">Guest Information</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">First name</label>
          <input
            {...register('first_name')}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Last name</label>
          <input
            {...register('last_name')}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Phone</label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-zinc-700">ID number</label>
          <input
            {...register('id_number')}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          {errors.id_number && (
            <p className="mt-1 text-xs text-red-500">{errors.id_number.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Note:** The `import { useEffect } from 'react'` line inside the function body above is a display error in this doc — in the actual file, import it at the top of the file alongside the other React imports. The actual file should have:

```tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
```

And use `useEffect` inside the function:

```tsx
useEffect(() => {
  onValuesChange(isValid ? values : null)
}, [isValid, JSON.stringify(values)])
```

- [ ] **Step 2: Write the corrected file (actual implementation)**

Create the file at `apps/website/app/modules/bookings/book/components/guest-info-form.tsx` with the following complete content:

```tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const guestSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email'),
  id_number: z.string().min(1, 'Required'),
})

export type GuestFormValues = z.infer<typeof guestSchema>

interface Props {
  onValuesChange: (values: GuestFormValues | null) => void
}

export function GuestInfoForm({ onValuesChange }: Props) {
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    mode: 'onChange',
  })

  const values = watch()

  useEffect(() => {
    onValuesChange(isValid ? values : null)
  }, [isValid, JSON.stringify(values)])

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-zinc-900">Guest Information</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">First name</label>
          <input
            {...register('first_name')}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Last name</label>
          <input
            {...register('last_name')}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Phone</label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-zinc-700">ID number</label>
          <input
            {...register('id_number')}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          {errors.id_number && (
            <p className="mt-1 text-xs text-red-500">{errors.id_number.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/website && yarn types:check 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/website/app/modules/bookings/book/components/guest-info-form.tsx
git commit -m "feat: add guest info form component for public booking page"
```

---

## Task 5: Booking summary sidebar component

**Files:**
- Create: `apps/website/app/modules/bookings/book/components/booking-summary.tsx`

Sticky sidebar showing selected dates, night count, rate × nights = total, and the "Request Booking" button. Replaced by a confirmation message on success.

- [ ] **Step 1: Create the booking summary component**

```tsx
// apps/website/app/modules/bookings/book/components/booking-summary.tsx

import { differenceInDays, format } from 'date-fns'
import { Link } from 'react-router'
import { APP_NAME } from '~/lib/constants'

interface Props {
  unit: PublicBookingUnit
  selectedRange: { from: Date; to: Date } | null
  canSubmit: boolean
  submitting: boolean
  error: string | null
  success: boolean
  trackingCode: string | null
  onSubmit: () => void
  origin: string
}

export function BookingSummary({
  unit,
  selectedRange,
  canSubmit,
  submitting,
  error,
  success,
  trackingCode,
  onSubmit,
  origin,
}: Props) {
  const nights = selectedRange
    ? differenceInDays(selectedRange.to, selectedRange.from)
    : 0
  const total = nights * unit.rent_fee

  if (success && trackingCode) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mb-3 text-3xl">✓</div>
        <h3 className="text-base font-semibold text-green-800">Booking request submitted!</h3>
        <p className="mt-2 text-sm text-green-700">
          The property manager will review your request and confirm shortly.
        </p>
        <p className="mt-4 text-sm text-zinc-600">
          Track your booking status:{' '}
          <Link
            to={`/bookings/track/${trackingCode}`}
            className="font-medium text-rose-600 underline"
          >
            View booking
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">Booking Summary</h2>

      {selectedRange ? (
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Check-in</span>
            <span className="font-medium">{format(selectedRange.from, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Check-out</span>
            <span className="font-medium">{format(selectedRange.to, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Duration</span>
            <span className="font-medium">
              {nights} night{nights !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="my-3 border-t" />
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">
              {formatAmount(convertPesewasToCedis(unit.rent_fee))} × {nights} nights
            </span>
            <span className="font-semibold">{formatAmount(convertPesewasToCedis(total))}</span>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-400">Select check-in and check-out dates to see pricing.</p>
      )}

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="mt-6 w-full rounded-lg bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Request Booking'}
      </button>

      <p className="mt-3 text-center text-xs text-zinc-400">
        Powered by{' '}
        <span className="font-medium capitalize">{APP_NAME}</span>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/website && yarn types:check 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/modules/bookings/book/components/booking-summary.tsx
git commit -m "feat: add booking summary sidebar for public booking page"
```

---

## Task 6: Public booking page module

**Files:**
- Create: `apps/website/app/modules/bookings/book/index.tsx`

Assembles the three components (calendar, guest info form, booking summary) into the two-column layout.

- [ ] **Step 1: Create the booking page module**

```tsx
// apps/website/app/modules/bookings/book/index.tsx

import { useState } from 'react'
import { format } from 'date-fns'
import { Link } from 'react-router'
import { AvailabilityCalendar } from './components/availability-calendar'
import { GuestInfoForm, type GuestFormValues } from './components/guest-info-form'
import { BookingSummary } from './components/booking-summary'
import { createPublicBooking } from '~/api/bookings/client'
import { APP_NAME } from '~/lib/constants'

interface Props {
  unit: PublicBookingUnit
  origin: string
}

export function BookModule({ unit, origin }: Props) {
  const [selectedRange, setSelectedRange] = useState<{ from: Date; to: Date } | null>(null)
  const [guestValues, setGuestValues] = useState<GuestFormValues | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [trackingCode, setTrackingCode] = useState<string | null>(null)

  const canSubmit = !!selectedRange && !!guestValues && !success

  async function handleSubmit() {
    if (!selectedRange || !guestValues) return
    setSubmitting(true)
    setError(null)
    try {
      const booking = await createPublicBooking(unit.slug, {
        check_in_date: format(selectedRange.from, 'yyyy-MM-dd'),
        check_out_date: format(selectedRange.to, 'yyyy-MM-dd'),
        ...guestValues,
      })
      setTrackingCode(booking.tracking_code)
      setSuccess(true)
    } catch (err: unknown) {
      if (err instanceof Response) {
        const body = await err.json().catch(() => ({}))
        setError(body?.errors?.message ?? 'Booking request failed. Please try again.')
      } else {
        setError('Booking request failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-end">
            <span className="text-xl font-extrabold text-rose-700">{APP_NAME.slice(0, 4)}</span>
            <span className="text-xl font-extrabold">{APP_NAME.slice(4)}</span>
          </Link>
          <span className="text-xs text-zinc-400">Guest Booking</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column: unit info + calendar + guest form */}
          <div className="space-y-8 lg:col-span-2">
            {/* Unit info */}
            <div>
              {unit.images.length > 0 && (
                <div className="mb-4 overflow-hidden rounded-xl">
                  <img
                    src={unit.images[0]}
                    alt={unit.name}
                    className="h-64 w-full object-cover"
                  />
                </div>
              )}
              <h1 className="text-2xl font-bold text-zinc-900">{unit.name}</h1>
              {unit.property?.name && (
                <p className="mt-1 text-sm text-zinc-500">{unit.property.name}</p>
              )}
              {unit.description && (
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{unit.description}</p>
              )}
              <p className="mt-3 text-lg font-semibold text-zinc-900">
                {new Intl.NumberFormat('en-GH', {
                  style: 'currency',
                  currency: unit.rent_fee_currency,
                  minimumFractionDigits: 0,
                }).format(unit.rent_fee / 100)}{' '}
                <span className="text-sm font-normal text-zinc-500">/ night</span>
              </p>
            </div>

            {/* Availability calendar */}
            <div>
              <h2 className="mb-3 text-base font-semibold text-zinc-900">Select dates</h2>
              <AvailabilityCalendar
                unitSlug={unit.slug}
                selectedRange={selectedRange}
                onRangeSelect={setSelectedRange}
              />
            </div>

            {/* Guest info — only shown after dates are selected */}
            {selectedRange && !success && (
              <GuestInfoForm onValuesChange={setGuestValues} />
            )}
          </div>

          {/* Right column: sticky summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <BookingSummary
                unit={unit}
                selectedRange={selectedRange}
                canSubmit={canSubmit}
                submitting={submitting}
                error={error}
                success={success}
                trackingCode={trackingCode}
                onSubmit={handleSubmit}
                origin={origin}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/website && yarn types:check 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/modules/bookings/book/index.tsx
git commit -m "feat: add public booking page module"
```

---

## Task 7: Public booking page route

**Files:**
- Create: `apps/website/app/routes/book.$propertySlug.$unitSlug.tsx`

Thin route file — SSR loader fetches unit info, exports meta and default module.

- [ ] **Step 1: Create the route file**

```tsx
// apps/website/app/routes/book.$propertySlug.$unitSlug.tsx

import type { Route } from './+types/book.$propertySlug.$unitSlug'
import { getUnitForBookingPageServer } from '~/api/bookings/client'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { BookModule } from '~/modules'

export async function loader({ params, request }: Route.LoaderArgs) {
  const baseUrl = environmentVariables().API_ADDRESS
  const unit = await getUnitForBookingPageServer(params.unitSlug, { baseUrl })
  return {
    unit,
    origin: getDomainUrl(request),
  }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  return getSocialMetas({
    title: `Book ${loaderData.unit.name}${loaderData.unit.property?.name ? ` at ${loaderData.unit.property.name}` : ''}`,
    url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
    origin: loaderData.origin,
  })
}

export default function BookingPage({ loaderData }: Route.ComponentProps) {
  return <BookModule unit={loaderData.unit} origin={loaderData.origin} />
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/website && yarn types:check 2>&1 | head -30
```

Expected: No errors. (`+types/book.$propertySlug.$unitSlug` will be generated by React Router on first `yarn dev` if not present — TypeScript errors about missing types are normal until then.)

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/routes/book.\$propertySlug.\$unitSlug.tsx
git commit -m "feat: add public booking page route"
```

---

## Task 8: Booking tracking page — phone gate component

**Files:**
- Create: `apps/website/app/modules/bookings/track/components/phone-gate.tsx`

The initial state of the tracking page before the booking is found.

- [ ] **Step 1: Create the phone gate component**

```tsx
// apps/website/app/modules/bookings/track/components/phone-gate.tsx

import { useState } from 'react'
import { APP_NAME } from '~/lib/constants'

interface Props {
  onVerify: (phone: string) => void
  error: string | null
  loading: boolean
}

export function PhoneGate({ onVerify, error, loading }: Props) {
  const [phone, setPhone] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (phone.trim().length >= 7) {
      onVerify(phone.trim())
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-2xl font-extrabold text-rose-700">{APP_NAME.slice(0, 4)}</span>
          <span className="text-2xl font-extrabold">{APP_NAME.slice(4)}</span>
          <p className="mt-2 text-sm text-zinc-500">Booking Tracker</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-base font-semibold text-zinc-900">Find your booking</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Enter the phone number you used when making the booking.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 XX XXX XXXX"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={phone.trim().length < 7 || loading}
              className="w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Finding...' : 'Find my booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/website && yarn types:check 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/modules/bookings/track/components/phone-gate.tsx
git commit -m "feat: add phone gate component for booking tracking"
```

---

## Task 9: Booking tracking page — booking details component

**Files:**
- Create: `apps/website/app/modules/bookings/track/components/booking-details.tsx`

Shows the booking status progress bar, dates, total, check-in code (when CONFIRMED+), and property contact email.

- [ ] **Step 1: Create the booking details component**

```tsx
// apps/website/app/modules/bookings/track/components/booking-details.tsx

import { format } from 'date-fns'
import { differenceInDays } from 'date-fns'
import { Link } from 'react-router'
import { APP_NAME } from '~/lib/constants'

const STATUS_STEPS: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED']

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked In',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount / 100)
  } catch {
    return `${currency} ${(amount / 100).toLocaleString()}`
  }
}

interface Props {
  booking: PublicBooking
}

export function BookingDetails({ booking }: Props) {
  const checkIn = new Date(booking.check_in_date)
  const checkOut = new Date(booking.check_out_date)
  const nights = differenceInDays(checkOut, checkIn)
  const total = nights * booking.rate

  const currentStepIndex = STATUS_STEPS.indexOf(booking.status as typeof STATUS_STEPS[number])
  const isCancelled = booking.status === 'CANCELLED'
  const showCheckInCode = ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'].includes(booking.status)

  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-end">
            <span className="text-xl font-extrabold text-rose-700">{APP_NAME.slice(0, 4)}</span>
            <span className="text-xl font-extrabold">{APP_NAME.slice(4)}</span>
          </Link>
          <span className="text-xs text-zinc-400">Booking Tracker</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {/* Header card */}
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400">Booking</p>
              <p className="mt-0.5 text-lg font-bold text-zinc-900">#{booking.code}</p>
            </div>
            <span
              className={[
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                isCancelled
                  ? 'bg-red-100 text-red-700'
                  : booking.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700',
              ].join(' ')}
            >
              {STATUS_LABELS[booking.status]}
            </span>
          </div>

          <div className="mt-4 space-y-1.5 text-sm text-zinc-500">
            <p>{booking.unit.name}</p>
            {booking.unit.property?.name && <p>{booking.unit.property.name}</p>}
          </div>
        </div>

        {/* Status progress bar — hidden when cancelled */}
        {!isCancelled && (
          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Booking Status</h3>
            <div className="relative flex items-center justify-between">
              {/* Line behind steps */}
              <div className="absolute left-0 right-0 top-3 h-0.5 bg-zinc-200" />
              <div
                className="absolute left-0 top-3 h-0.5 bg-rose-500 transition-all"
                style={{
                  width: `${Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1) * 100}%`,
                }}
              />
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex
                return (
                  <div key={step} className="relative flex flex-col items-center gap-1.5">
                    <div
                      className={[
                        'h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold',
                        done
                          ? 'border-rose-500 bg-rose-500 text-white'
                          : 'border-zinc-300 bg-white text-zinc-400',
                      ].join(' ')}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={['text-xs', done ? 'text-rose-600 font-medium' : 'text-zinc-400'].join(' ')}>
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Check-in code — shown when CONFIRMED or later */}
        {showCheckInCode && booking.check_in_code && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="text-sm font-medium text-green-800">Your Check-In Code</p>
            <p className="mt-2 text-4xl font-extrabold tracking-widest text-green-900">
              {booking.check_in_code}
            </p>
            <p className="mt-2 text-xs text-green-700">Show this code to the property manager on arrival.</p>
          </div>
        )}

        {/* Booking details */}
        <div className="rounded-xl border bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900">Booking Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Check-in</dt>
              <dd className="font-medium">{format(checkIn, 'MMM d, yyyy')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Check-out</dt>
              <dd className="font-medium">{format(checkOut, 'MMM d, yyyy')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Duration</dt>
              <dd className="font-medium">{nights} night{nights !== 1 ? 's' : ''}</dd>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Total</dt>
                <dd className="font-semibold">{formatCurrency(total, booking.currency)}</dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Property contact */}
        {booking.unit.property?.contact_email && (
          <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-1 text-sm font-semibold text-zinc-900">Contact</h3>
            <a
              href={`mailto:${booking.unit.property.contact_email}`}
              className="text-sm text-rose-600 underline"
            >
              {booking.unit.property.contact_email}
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/website && yarn types:check 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/modules/bookings/track/components/booking-details.tsx
git commit -m "feat: add booking details component for tracking page"
```

---

## Task 10: Booking tracking page module and route

**Files:**
- Create: `apps/website/app/modules/bookings/track/index.tsx`
- Create: `apps/website/app/routes/bookings.track.$trackingCode.tsx`

The tracking module handles the phone gate → booking details transition in client state. No SSR needed — the tracking code is in the URL but the phone lookup is client-initiated.

- [ ] **Step 1: Create the tracking module**

```tsx
// apps/website/app/modules/bookings/track/index.tsx

import { useState } from 'react'
import { PhoneGate } from './components/phone-gate'
import { BookingDetails } from './components/booking-details'
import { trackBooking } from '~/api/bookings/client'

interface Props {
  trackingCode: string
}

export function BookTrackModule({ trackingCode }: Props) {
  const [booking, setBooking] = useState<PublicBooking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleVerify(phone: string) {
    setLoading(true)
    setError(null)
    try {
      const found = await trackBooking(trackingCode, phone)
      setBooking(found)
    } catch (err: unknown) {
      if (err instanceof Response && err.status === 403) {
        setError('No booking found for this phone number.')
      } else {
        setError('Unable to find your booking. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (booking) {
    return <BookingDetails booking={booking} />
  }

  return <PhoneGate onVerify={handleVerify} error={error} loading={loading} />
}
```

- [ ] **Step 2: Create the tracking route**

```tsx
// apps/website/app/routes/bookings.track.$trackingCode.tsx

import type { Route } from './+types/bookings.track.$trackingCode'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { BookTrackModule } from '~/modules'

export function loader({ request }: Route.LoaderArgs) {
  return { origin: getDomainUrl(request) }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  return getSocialMetas({
    title: 'Track Your Booking',
    url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
    origin: loaderData.origin,
  })
}

export default function BookingTrackPage({ params }: Route.ComponentProps) {
  return <BookTrackModule trackingCode={params.trackingCode} />
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/website && yarn types:check 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/website/app/modules/bookings/track/index.tsx apps/website/app/routes/bookings.track.\$trackingCode.tsx
git commit -m "feat: add booking tracking module and route"
```

---

## Task 11: Module exports and sitemap

**Files:**
- Modify: `apps/website/app/modules/index.ts`
- Modify: `apps/website/app/routes/sitemap[.]xml.tsx`

- [ ] **Step 1: Add exports to modules/index.ts**

Open `apps/website/app/modules/index.ts`. It currently contains:

```ts
export * from './home'
export * from './pricing'
export * from './blog'
export * from './blog/blog-post'

export * from './legal/terms'
export * from './legal/privacy-policy'

export * from './tenants/apply'
export * from './tenants/apply/success'
export * from './tenants/track'
```

Add two lines at the bottom:

```ts
export * from './bookings/book'
export * from './bookings/track'
```

- [ ] **Step 2: Verify no naming collisions**

Check that `BookModule` and `BookTrackModule` don't conflict with existing exports:

```bash
grep -r "BookModule\|BookTrackModule" apps/website/app/modules/
```

Expected: Only the two new files appear.

- [ ] **Step 3: Update sitemap**

Open `apps/website/app/routes/sitemap[.]xml.tsx`. The `staticRoutes` array currently contains:

```ts
const staticRoutes = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/pricing', priority: '0.8', changefreq: 'monthly' },
  { url: '/blog', priority: '0.8', changefreq: 'weekly' },
  { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
]
```

The booking page route (`/book/:propertySlug/:unitSlug`) is dynamic and requires real unit slugs to enumerate. We cannot list it statically without fetching all units from the backend. Leave the static array unchanged for now. Add a comment above the `staticRoutes` declaration explaining this:

```ts
// NOTE: /book/:propertySlug/:unitSlug is intentionally omitted from the sitemap.
// It is a dynamic route requiring unit slugs from the backend. Add enumeration here
// if a public units list endpoint is available.
const staticRoutes = [
  ...
]
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/website && yarn types:check 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/website/app/modules/index.ts apps/website/app/routes/sitemap\[.\]xml.tsx
git commit -m "feat: export booking modules, note sitemap omission for dynamic booking route"
```

---

## Task 12: End-to-end verification

- [ ] **Step 1: Start the website dev server**

```bash
cd apps/website && yarn dev
```

Expected: Server starts on port 3001 (or whichever port is configured) with no build errors.

- [ ] **Step 2: Verify the public booking page renders**

Navigate to `http://localhost:3001/book/test-property/test-unit`.

If the backend is running locally and `test-property/test-unit` slugs don't exist, the SSR loader will throw. Verify the page either:
- Renders unit info correctly (if slugs exist), or
- Shows an error page from the thrown loader error (confirming the route is mounted — not a 404 from routing)

- [ ] **Step 3: Verify the tracking page renders**

Navigate to `http://localhost:3001/bookings/track/FAKE-CODE`.

Expected: Phone gate form is visible. Entering a phone and submitting should return a 403 error ("No booking found for this phone number.") — confirming the client API call fires correctly.

- [ ] **Step 4: Verify TypeScript passes clean**

```bash
cd apps/website && yarn types:check
```

Expected: Exit 0, no errors.

- [ ] **Step 5: Verify lint passes**

```bash
cd apps/website && yarn lint
```

Expected: No errors.

- [ ] **Step 6: Full integration test (requires running backend + seeded data)**

If the backend is running with a booking-mode property:
1. Visit `/book/<property-slug>/<unit-slug>` — verify unit info, rate, and calendar load.
2. Select check-in and check-out dates — verify guest info form appears.
3. Fill all guest fields and click "Request Booking" — verify success message with tracking link.
4. Click tracking link — visit `/bookings/track/<tracking-code>` — enter guest phone — verify booking details appear with PENDING status.
5. In the property manager portal, confirm the booking. Revisit the tracking page — verify CONFIRMED status and check-in code appear.

---

## Self-Review Checklist

**Spec coverage:**

| Spec requirement | Task(s) |
|---|---|
| Public booking page — single-page scroll, two-column | Task 6 `BookModule` layout |
| Unit photos, name, property name, description | Task 6 left column |
| Rate display | Task 6 (rent_fee / 100 with currency) |
| react-day-picker range calendar with 3-month window | Task 3 `AvailabilityCalendar` |
| Blocked dates as disabled (greyed) | Task 3 `blocksToDisabledDates` + `disabled` prop |
| Guest info form shown after dates selected | Task 4 `GuestInfoForm` + Task 6 conditional render |
| Sticky booking summary sidebar | Task 5 `BookingSummary` with `sticky top-8` |
| Number of nights + rate × nights = total | Task 5 |
| "Request Booking" button disabled until valid | Task 6 `canSubmit` |
| POST to `/v1/public/units/:slug/bookings` | Task 2 `createPublicBooking` |
| Success: confirmation message + tracking link | Task 5 success state |
| SSR loader for unit + property details | Task 7 route loader |
| SEO meta export | Task 7 `meta` function |
| Sitemap entry (dynamic — omitted with comment) | Task 11 |
| Tracking page — phone gate | Task 8 `PhoneGate` |
| Phone gate calls GET /…/track/:code?phone= | Task 2 `trackBooking` |
| 403 → "No booking found for this phone number" | Task 10 `BookTrackModule` error handling |
| Status progress bar: Pending → Confirmed → Checked-in → Completed | Task 9 `BookingDetails` |
| 5-digit check-in code shown when CONFIRMED+ | Task 9 `showCheckInCode` condition |
| Property contact email | Task 9 `booking.unit.property.contact_email` |
| Tracking page excluded from sitemap | Task 11 (no entry added) |
