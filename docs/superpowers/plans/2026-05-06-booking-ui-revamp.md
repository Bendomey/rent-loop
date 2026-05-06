# Booking UI Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp the guest-facing booking page at `/book/$propertySlug/$unitSlug` from a functional but plain layout into a polished, clean/minimal experience.

**Architecture:** All changes are purely in the presentation layer — no API, loader, or validation logic changes. Two new components (`ImageGallery`, `SuccessModal`) are added; four existing components are updated. The `BookModule` orchestrator is updated to wire everything together.

**Tech Stack:** React 19, React Router v7, Tailwind CSS v4, react-day-picker v9, React Hook Form, date-fns 4

---

## File Map

| Action | File |
|--------|------|
| Modify | `apps/website/app/app.css` |
| Create | `apps/website/app/modules/bookings/book/components/image-gallery.tsx` |
| Modify | `apps/website/app/modules/bookings/book/components/availability-calendar.tsx` |
| Modify | `apps/website/app/modules/bookings/book/components/guest-info-form.tsx` |
| Modify | `apps/website/app/modules/bookings/book/components/booking-summary.tsx` |
| Create | `apps/website/app/modules/bookings/book/components/success-modal.tsx` |
| Modify | `apps/website/app/modules/bookings/book/index.tsx` |

---

## Task 1: Add CSS keyframe animations to app.css

**Files:**
- Modify: `apps/website/app/app.css`

- [ ] **Step 1: Add keyframes at the bottom of `app.css`**

Append to the end of `apps/website/app/app.css`:

```css
@keyframes modal-in {
	from {
		transform: scale(0.95);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}

@keyframes confetti-burst {
	from {
		transform: translate(0, 0) rotate(0deg);
		opacity: 1;
	}
	to {
		transform: translate(var(--tx, 0px), var(--ty, -80px)) rotate(360deg);
		opacity: 0;
	}
}
```

- [ ] **Step 2: Verify TypeScript + lint pass**

Run from `apps/website/`:
```bash
yarn types:check
yarn lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/app.css
git commit -m "feat: add modal-in and confetti-burst keyframe animations"
```

---

## Task 2: Create ImageGallery component

**Files:**
- Create: `apps/website/app/modules/bookings/book/components/image-gallery.tsx`

**Layout logic:**
- 0 images → render nothing
- 1 image → full-width hero
- 2–5 images → hero (left, `flex-[2]`) + thumbnails stacked vertically (right, `flex-1`)
- 5+ images → same layout but last visible thumbnail gets a `"+N photos"` overlay chip

- [ ] **Step 1: Create the file**

Create `apps/website/app/modules/bookings/book/components/image-gallery.tsx`:

```tsx
interface Props {
	images: string[]
	altPrefix: string
}

export function ImageGallery({ images, altPrefix }: Props) {
	if (images.length === 0) return null

	const hero = images[0]
	const thumbnails = images.slice(1, 5)
	const overflow = images.length - 5

	if (thumbnails.length === 0) {
		return (
			<div className="h-72 overflow-hidden rounded-xl lg:h-80">
				<img src={hero} alt={altPrefix} className="h-full w-full object-cover" />
			</div>
		)
	}

	return (
		<div className="flex h-72 gap-0.5 overflow-hidden rounded-xl lg:h-80">
			<div className="flex-[2] overflow-hidden">
				<img
					src={hero}
					alt={`${altPrefix} 1`}
					className="h-full w-full object-cover"
				/>
			</div>
			<div className="flex flex-1 flex-col gap-0.5">
				{thumbnails.map((src, i) => {
					const isLast = i === thumbnails.length - 1
					const showOverflow = isLast && overflow > 0
					return (
						<div key={i} className="relative flex-1 overflow-hidden">
							<img
								src={src}
								alt={`${altPrefix} ${i + 2}`}
								className="h-full w-full object-cover"
							/>
							{showOverflow && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/40">
									<span className="text-sm font-semibold text-white">
										+{overflow} photos
									</span>
								</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}
```

- [ ] **Step 2: Verify types pass**

```bash
yarn types:check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/modules/bookings/book/components/image-gallery.tsx
git commit -m "feat: add ImageGallery component with hero + thumbnail layout"
```

---

## Task 3: Update AvailabilityCalendar — skeleton loader + rose theme

**Files:**
- Modify: `apps/website/app/modules/bookings/book/components/availability-calendar.tsx`

Changes: replace the "Loading availability..." text with a shimmer skeleton, and wrap `DayPicker` in a div that overrides the accent color CSS variables to match the rose-600 brand color.

- [ ] **Step 1: Replace file contents**

Replace `apps/website/app/modules/bookings/book/components/availability-calendar.tsx` with:

```tsx
import { addDays, format, startOfToday } from 'date-fns'
import { useEffect, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { getUnitAvailabilityForClient } from '~/api/bookings/client'

interface Props {
	unitSlug: string
	selectedRange: { from: Date; to: Date } | null
	onRangeSelect: (range: { from: Date; to: Date } | null) => void
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

export function AvailabilityCalendar({
	unitSlug,
	selectedRange,
	onRangeSelect,
}: Props) {
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
		return () => {
			cancelled = true
		}
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
		return <div className="h-64 w-full animate-pulse rounded-xl bg-zinc-100" />
	}

	return (
		<div
			style={
				{
					'--rdp-accent-color': '#e11d48',
					'--rdp-accent-background-color': '#fff1f2',
				} as React.CSSProperties
			}
		>
			<DayPicker
				mode="range"
				selected={selectedRange ?? undefined}
				onSelect={handleSelect}
				disabled={[{ before: today }, ...disabledDates]}
				fromDate={today}
				toDate={threeMonthsOut}
				numberOfMonths={1}
			/>
		</div>
	)
}
```

- [ ] **Step 2: Verify types pass**

```bash
yarn types:check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/modules/bookings/book/components/availability-calendar.tsx
git commit -m "feat: add skeleton loader and rose theme to AvailabilityCalendar"
```

---

## Task 4: Polish GuestInfoForm styles

**Files:**
- Modify: `apps/website/app/modules/bookings/book/components/guest-info-form.tsx`

Changes: input border/radius/focus ring polish only. No logic or schema changes.

- [ ] **Step 1: Replace file contents**

Replace `apps/website/app/modules/bookings/book/components/guest-info-form.tsx` with:

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isValid, JSON.stringify(values)])

	return (
		<div className="space-y-4">
			<h3 className="text-base font-semibold text-zinc-900">
				Guest Information
			</h3>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label className="mb-1 block text-sm font-medium text-zinc-700">
						First name
					</label>
					<input
						{...register('first_name')}
						className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500"
					/>
					{errors.first_name && (
						<p className="mt-1 text-xs text-red-500">
							{errors.first_name.message}
						</p>
					)}
				</div>
				<div>
					<label className="mb-1 block text-sm font-medium text-zinc-700">
						Last name
					</label>
					<input
						{...register('last_name')}
						className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500"
					/>
					{errors.last_name && (
						<p className="mt-1 text-xs text-red-500">
							{errors.last_name.message}
						</p>
					)}
				</div>
				<div>
					<label className="mb-1 block text-sm font-medium text-zinc-700">
						Phone
					</label>
					<input
						{...register('phone')}
						type="tel"
						className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500"
					/>
					{errors.phone && (
						<p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
					)}
				</div>
				<div>
					<label className="mb-1 block text-sm font-medium text-zinc-700">
						Email
					</label>
					<input
						{...register('email')}
						type="email"
						className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500"
					/>
					{errors.email && (
						<p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
					)}
				</div>
				<div className="sm:col-span-2">
					<label className="mb-1 block text-sm font-medium text-zinc-700">
						ID number
					</label>
					<input
						{...register('id_number')}
						className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500"
					/>
					{errors.id_number && (
						<p className="mt-1 text-xs text-red-500">
							{errors.id_number.message}
						</p>
					)}
				</div>
			</div>
		</div>
	)
}
```

- [ ] **Step 2: Verify types pass**

```bash
yarn types:check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/modules/bookings/book/components/guest-info-form.tsx
git commit -m "feat: polish GuestInfoForm input styles"
```

---

## Task 5: Update BookingSummary — drop success props, polish UI, spinner

**Files:**
- Modify: `apps/website/app/modules/bookings/book/components/booking-summary.tsx`

Changes: remove `success` and `trackingCode` props (success state is now handled by `SuccessModal`), polish date/price rows, add an inline SVG spinner for the loading state, improve error display.

- [ ] **Step 1: Replace file contents**

Replace `apps/website/app/modules/bookings/book/components/booking-summary.tsx` with:

```tsx
import { differenceInDays, format } from 'date-fns'
import { APP_NAME } from '~/lib/constants'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface Props {
	unit: PropertyUnit
	selectedRange: { from: Date; to: Date } | null
	canSubmit: boolean
	submitting: boolean
	error: string | null
	onSubmit: () => void
}

export function BookingSummary({
	unit,
	selectedRange,
	canSubmit,
	submitting,
	error,
	onSubmit,
}: Props) {
	const nights = selectedRange
		? differenceInDays(selectedRange.to, selectedRange.from)
		: 0
	const total = nights * unit.rent_fee

	return (
		<div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
			<h2 className="text-base font-semibold text-zinc-900">Booking Summary</h2>

			{selectedRange ? (
				<div className="mt-4 space-y-3 text-sm">
					<div className="flex justify-between">
						<span className="text-zinc-400">Check-in</span>
						<span className="font-medium text-zinc-900">
							{format(selectedRange.from, 'MMM d, yyyy')}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-zinc-400">Check-out</span>
						<span className="font-medium text-zinc-900">
							{format(selectedRange.to, 'MMM d, yyyy')}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-zinc-400">Duration</span>
						<span className="font-medium text-zinc-900">
							{nights} night{nights !== 1 ? 's' : ''}
						</span>
					</div>
					<div className="my-3 border-t border-zinc-100" />
					<div className="flex justify-between text-sm">
						<span className="text-zinc-400">
							{formatAmount(convertPesewasToCedis(unit.rent_fee))} × {nights}{' '}
							nights
						</span>
						<span className="font-semibold text-zinc-900">
							{formatAmount(convertPesewasToCedis(total))}
						</span>
					</div>
				</div>
			) : (
				<p className="mt-4 text-sm text-zinc-400">
					Select check-in and check-out dates to see pricing.
				</p>
			)}

			{error ? (
				<div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
					<span className="mt-0.5 shrink-0">⚠</span>
					<span>{error}</span>
				</div>
			) : null}

			<button
				onClick={onSubmit}
				disabled={!canSubmit || submitting}
				className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{submitting ? (
					<>
						<svg
							className="h-4 w-4 animate-spin"
							viewBox="0 0 24 24"
							fill="none"
							aria-hidden="true"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8v8H4z"
							/>
						</svg>
						Requesting...
					</>
				) : (
					'Request Booking'
				)}
			</button>

			<p className="mt-3 text-center text-xs text-zinc-400">
				Powered by <span className="font-medium capitalize">{APP_NAME}</span>
			</p>
		</div>
	)
}
```

- [ ] **Step 2: Verify the component itself has no type errors**

Open `booking-summary.tsx` in the editor and confirm no red underlines. Do NOT run `yarn types:check` yet — `index.tsx` still passes the now-removed `success`/`trackingCode` props and will fail until Task 7 updates it.

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/modules/bookings/book/components/booking-summary.tsx
git commit -m "feat: polish BookingSummary — drop success state, add spinner, improve error UI"
```

---

## Task 6: Create SuccessModal component

**Files:**
- Create: `apps/website/app/modules/bookings/book/components/success-modal.tsx`

The modal uses the `modal-in` keyframe (added in Task 1) for the scale entrance and `confetti-burst` for the particle animation. Each confetti piece reads `--tx` and `--ty` CSS custom properties for its target position.

- [ ] **Step 1: Create the file**

Create `apps/website/app/modules/bookings/book/components/success-modal.tsx`:

```tsx
import { Link } from 'react-router'

interface Props {
	trackingCode: string
	onClose: () => void
}

const CONFETTI: Array<{
	color: string
	tx: string
	ty: string
	delay: string
}> = [
	{ color: '#e11d48', tx: '-60px', ty: '-80px', delay: '0ms' },
	{ color: '#f59e0b', tx: '60px', ty: '-80px', delay: '50ms' },
	{ color: '#22c55e', tx: '-80px', ty: '-40px', delay: '100ms' },
	{ color: '#0ea5e9', tx: '80px', ty: '-40px', delay: '150ms' },
	{ color: '#a855f7', tx: '-40px', ty: '-90px', delay: '200ms' },
	{ color: '#e11d48', tx: '40px', ty: '-90px', delay: '250ms' },
	{ color: '#f59e0b', tx: '-70px', ty: '-60px', delay: '80ms' },
	{ color: '#22c55e', tx: '70px', ty: '-60px', delay: '130ms' },
]

export function SuccessModal({ trackingCode, onClose }: Props) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="relative mx-4 w-full max-w-sm animate-[modal-in_200ms_ease-out_forwards] rounded-2xl bg-white p-8 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Confetti burst */}
				<div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
					{CONFETTI.map((c, i) => (
						<span
							key={i}
							className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full animate-[confetti-burst_600ms_ease-out_forwards]"
							style={
								{
									backgroundColor: c.color,
									'--tx': c.tx,
									'--ty': c.ty,
									animationDelay: c.delay,
								} as React.CSSProperties
							}
						/>
					))}
				</div>

				{/* Content */}
				<div className="text-center">
					<div className="text-4xl">🎉</div>
					<h2 className="mt-3 text-xl font-bold text-zinc-900">
						You're booked!
					</h2>
					<p className="mt-2 text-sm text-zinc-500">
						The property manager will review your request and confirm shortly.
					</p>

					<div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left">
						<p className="text-xs uppercase tracking-wider text-zinc-400">
							Tracking code
						</p>
						<p className="mt-0.5 font-mono text-lg font-bold text-zinc-900">
							{trackingCode}
						</p>
					</div>

					<Link
						to={`/bookings/track/${trackingCode}`}
						className="mt-4 block w-full rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
					>
						Track booking status →
					</Link>

					<button
						onClick={onClose}
						className="mt-3 block w-full text-sm text-zinc-400 underline"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	)
}
```

- [ ] **Step 2: Verify types pass**

```bash
yarn types:check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/modules/bookings/book/components/success-modal.tsx
git commit -m "feat: add SuccessModal with confetti animation and tracking code"
```

---

## Task 7: Update BookModule — wire all components, polish layout

**Files:**
- Modify: `apps/website/app/modules/bookings/book/index.tsx`

Changes:
- Replace inline `<img>` with `<ImageGallery>`
- Remove conditional render on `<GuestInfoForm>` — always show it
- Replace inline success card in `<BookingSummary>` with `<SuccessModal>` portal
- Remove `success` and `trackingCode` props from `<BookingSummary>` call
- Polish unit info section typography
- Add `payment_frequency` → readable label mapping for price display

- [ ] **Step 1: Replace file contents**

Replace `apps/website/app/modules/bookings/book/index.tsx` with:

```tsx
import { format } from 'date-fns'
import { useState } from 'react'
import { Link } from 'react-router'
import { AvailabilityCalendar } from './components/availability-calendar'
import { BookingSummary } from './components/booking-summary'
import { GuestInfoForm, type GuestFormValues } from './components/guest-info-form'
import { ImageGallery } from './components/image-gallery'
import { SuccessModal } from './components/success-modal'
import { createBooking } from '~/api/bookings/client'
import { APP_NAME } from '~/lib/constants'

const FREQUENCY_LABELS: Record<PropertyUnit['payment_frequency'], string> = {
	DAILY: 'night',
	WEEKLY: 'week',
	MONTHLY: 'month',
	QUARTERLY: 'quarter',
	BIANNUALLY: '6 months',
	ANNUALLY: 'year',
}

interface Props {
	unit: PropertyUnit
}

export function BookModule({ unit }: Props) {
	const [selectedRange, setSelectedRange] = useState<{
		from: Date
		to: Date
	} | null>(null)
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
			const booking = await createBooking(unit.slug, {
				check_in_date: format(selectedRange.from, 'yyyy-MM-dd'),
				check_out_date: format(selectedRange.to, 'yyyy-MM-dd'),
				...guestValues,
			})
			setTrackingCode(booking.tracking_code)
			setSuccess(true)
		} catch (err: unknown) {
			if (err instanceof Response) {
				const body = await err.json().catch(() => ({}))
				setError(
					(body as { errors?: { message?: string } })?.errors?.message ??
						'Booking request failed. Please try again.',
				)
			} else {
				setError('Booking request failed. Please try again.')
			}
		} finally {
			setSubmitting(false)
		}
	}

	const frequencyLabel = FREQUENCY_LABELS[unit.payment_frequency] ?? 'period'

	return (
		<div className="min-h-dvh bg-zinc-50">
			{success && trackingCode && (
				<SuccessModal
					trackingCode={trackingCode}
					onClose={() => setSuccess(false)}
				/>
			)}

			<header className="border-b bg-white">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
					<Link to="/" className="flex items-end">
						<span className="text-xl font-extrabold text-rose-700">
							{APP_NAME.slice(0, 4)}
						</span>
						<span className="text-xl font-extrabold">{APP_NAME.slice(4)}</span>
					</Link>
					<span className="text-xs text-zinc-400">Guest Booking</span>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 py-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Left column: gallery + unit info + calendar + guest form */}
					<div className="space-y-8 lg:col-span-2">
						<ImageGallery images={unit.images} altPrefix={unit.name} />

						<div>
							<h1 className="text-2xl font-bold tracking-tight text-zinc-900">
								{unit.name}
							</h1>
							{unit.property?.name ? (
								<p className="mt-0.5 text-sm text-zinc-500">
									{unit.property.name}
								</p>
							) : null}
							{unit.description ? (
								<p className="mt-3 text-sm leading-relaxed text-zinc-600">
									{unit.description}
								</p>
							) : null}
							<p className="mt-4 text-xl font-semibold text-zinc-900">
								{new Intl.NumberFormat('en-GH', {
									style: 'currency',
									currency: unit.rent_fee_currency,
									minimumFractionDigits: 0,
								}).format(unit.rent_fee / 100)}{' '}
								<span className="text-sm font-normal text-zinc-400">
									/ {frequencyLabel}
								</span>
							</p>
						</div>

						<div>
							<h2 className="mb-3 text-base font-semibold text-zinc-900">
								Select dates
							</h2>
							<AvailabilityCalendar
								unitSlug={unit.slug}
								selectedRange={selectedRange}
								onRangeSelect={setSelectedRange}
							/>
						</div>

						<GuestInfoForm onValuesChange={setGuestValues} />
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
								onSubmit={handleSubmit}
							/>
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
```

- [ ] **Step 2: Verify types and lint pass**

```bash
yarn types:check
yarn lint
```
Expected: no errors.

- [ ] **Step 3: Start dev server and verify in browser**

```bash
yarn dev
```

Open `http://localhost:3000` and navigate to a booking URL (e.g. `/book/some-property/some-unit`). Verify:
- Gallery renders (hero + thumbnails if multiple images)
- Calendar shows shimmer while loading, then DayPicker in rose theme
- Guest form is always visible (not hidden until dates selected)
- Selecting dates + filling guest form enables the "Request Booking" button
- Submitting shows spinner in button
- On success, modal appears with 🎉, tracking code, and confetti animation
- Clicking "Close" or the backdrop dismisses the modal

- [ ] **Step 4: Commit**

```bash
git add apps/website/app/modules/bookings/book/index.tsx
git commit -m "feat: revamp booking UI — gallery, always-on guest form, success modal"
```
