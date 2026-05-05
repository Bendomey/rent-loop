import { format } from 'date-fns'
import { useState } from 'react'
import { Link } from 'react-router'
import { createPublicBooking } from '~/api/bookings/client'
import { APP_NAME } from '~/lib/constants'
import { AvailabilityCalendar } from './components/availability-calendar'
import { BookingSummary } from './components/booking-summary'
import { GuestInfoForm, type GuestFormValues } from './components/guest-info-form'

interface Props {
	unit: PublicBookingUnit
}

export function BookModule({ unit }: Props) {
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

	return (
		<div className="min-h-dvh bg-zinc-50">
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
					{/* Left column: unit info + calendar + guest form */}
					<div className="space-y-8 lg:col-span-2">
						<div>
							{unit.images.length > 0 ? (
								<div className="mb-4 overflow-hidden rounded-xl">
									<img
										src={unit.images[0]}
										alt={unit.name}
										className="h-64 w-full object-cover"
									/>
								</div>
							) : null}
							<h1 className="text-2xl font-bold text-zinc-900">{unit.name}</h1>
							{unit.property?.name ? (
								<p className="mt-1 text-sm text-zinc-500">{unit.property.name}</p>
							) : null}
							{unit.description ? (
								<p className="mt-3 text-sm leading-relaxed text-zinc-600">
									{unit.description}
								</p>
							) : null}
							<p className="mt-3 text-lg font-semibold text-zinc-900">
								{new Intl.NumberFormat('en-GH', {
									style: 'currency',
									currency: unit.rent_fee_currency,
									minimumFractionDigits: 0,
								}).format(unit.rent_fee / 100)}{' '}
								<span className="text-sm font-normal text-zinc-500">/ night</span>
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

						{selectedRange && !success ? (
							<GuestInfoForm onValuesChange={setGuestValues} />
						) : null}
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
							/>
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
