import { format } from 'date-fns'
import {
	AirVent,
	Bath,
	Car,
	Dumbbell,
	Flame,
	type LucideIcon,
	Shield,
	Sofa,
	TreePine,
	Tv,
	Utensils,
	Waves,
	Wifi,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { AboutHost } from './components/about-host'
import { AvailabilityCalendar } from './components/availability-calendar'
import { BookingSummary } from './components/booking-summary'
import {
	GuestInfoForm,
	type GuestFormValues,
} from './components/guest-info-form'
import { ImageGallery } from './components/image-gallery'
import { PropertyMap } from './components/property-map'
import { ReviewsSection } from './components/reviews-section'
import { SimilarUnits } from './components/similar-units'
import { SuccessModal } from './components/success-modal'
import { createBooking } from '~/api/bookings/client'
import { APP_NAME } from '~/lib/constants'

const FEATURE_ICONS: Record<string, LucideIcon> = {
	wifi: Wifi,
	internet: Wifi,
	parking: Car,
	garage: Car,
	pool: Waves,
	swimming: Waves,
	gym: Dumbbell,
	fitness: Dumbbell,
	kitchen: Utensils,
	cooking: Utensils,
	tv: Tv,
	television: Tv,
	air_conditioning: AirVent,
	ac: AirVent,
	heating: Flame,
	heater: Flame,
	garden: TreePine,
	outdoor: TreePine,
	security: Shield,
	cctv: Shield,
	living_room: Sofa,
	lounge: Sofa,
	bathroom: Bath,
	bath: Bath,
}

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
	const [showAllFeatures, setShowAllFeatures] = useState(false)

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
					<div className="lg:col-span-2">
						<ImageGallery images={unit.images} altPrefix={unit.name} />

						<div className="py-8">
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

						<hr className="my-5 border-zinc-200" />

						{unit.features && Object.keys(unit.features).length > 0 && (
							<div className="py-8">
								<h2 className="mb-4 text-xl font-semibold text-zinc-900">
									What this place offers
								</h2>
								{(() => {
									const allFeatures = Object.entries(unit.features!)
									const visible = showAllFeatures
										? allFeatures
										: allFeatures.slice(0, 6)
									const hasMore = allFeatures.length > 6
									return (
										<>
											<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
												{visible.map(([key, value]) => {
													const Icon =
														FEATURE_ICONS[key.toLowerCase()] ??
														FEATURE_ICONS[key.toLowerCase().split('_')[0] ?? '']
													return (
														<div
															key={key}
															className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3"
														>
															{Icon ? (
																<Icon className="h-5 w-5 shrink-0 text-zinc-500" />
															) : (
																<div className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
															)}
															<div className="min-w-0">
																<p className="truncate text-sm font-medium text-zinc-900 capitalize">
																	{key.replace(/_/g, ' ')}
																</p>
																{value && value !== 'true' && (
																	<p className="truncate text-xs text-zinc-500">
																		{value}
																	</p>
																)}
															</div>
														</div>
													)
												})}
											</div>
											{hasMore && (
												<button
													onClick={() => setShowAllFeatures((v) => !v)}
													className="mt-4 text-sm font-medium text-zinc-900 underline underline-offset-2"
												>
													{showAllFeatures
														? 'Show less'
														: `Show all ${allFeatures.length} amenities`}
												</button>
											)}
										</>
									)
								})()}
							</div>
						)}

						<hr className="my-5 border-zinc-200" />

						<div className="py-8">
							<h2 className="mb-1 text-xl font-semibold text-zinc-900">
								Select checkout date
							</h2>
							<p className="mb-2 text-sm text-zinc-500">
								Use the calendar below to select your desired check-in and
							</p>
							<AvailabilityCalendar
								unitSlug={unit.slug}
								selectedRange={selectedRange}
								onRangeSelect={setSelectedRange}
							/>
						</div>

						<hr className="my-5 border-zinc-200" />

						<div className="py-8">
							<div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-6">
								<GuestInfoForm onValuesChange={setGuestValues} />
							</div>
						</div>
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

				{/* Below-the-fold sections — appear after reserve block on mobile */}
				<hr className="my-5 border-zinc-200" />

				<div className="py-8">
					<h2 className="mb-6 text-xl font-semibold text-zinc-900">Reviews</h2>
					<ReviewsSection />
				</div>

				<hr className="my-5 border-zinc-200" />

				<div className="py-8">
					<h2 className="mb-4 text-xl font-semibold text-zinc-900">
						Where you'll be
					</h2>
					<PropertyMap propertyName={unit.property?.name ?? unit.name} />
				</div>

				<hr className="my-5 border-zinc-200" />

				<div className="py-8">
					<h2 className="mb-6 text-xl font-semibold text-zinc-900">
						About your host
					</h2>
					<AboutHost property={unit.property} />
				</div>

				<hr className="my-5 border-zinc-200" />

				<div className="py-8">
					<h2 className="mb-4 text-xl font-semibold text-zinc-900">
						More units nearby
					</h2>
					<SimilarUnits />
				</div>
			</main>
		</div>
	)
}
