import { differenceInDays, format } from 'date-fns'
import { Link } from 'react-router'
import { APP_NAME } from '~/lib/constants'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

const STATUS_STEPS: Array<Exclude<BookingStatus, 'CANCELLED'>> = [
	'PENDING',
	'CONFIRMED',
	'CHECKED_IN',
	'COMPLETED',
]

const STATUS_LABELS: Record<BookingStatus, string> = {
	PENDING: 'Pending',
	CONFIRMED: 'Confirmed',
	CHECKED_IN: 'Checked In',
	COMPLETED: 'Completed',
	CANCELLED: 'Cancelled',
}

interface Props {
	booking: PublicBooking
}

export function BookingDetails({ booking }: Props) {
	const checkIn = new Date(booking.check_in_date)
	const checkOut = new Date(booking.check_out_date)
	const nights = differenceInDays(checkOut, checkIn)
	const total = nights * booking.rate

	const currentStepIndex = STATUS_STEPS.indexOf(
		booking.status as Exclude<BookingStatus, 'CANCELLED'>,
	)
	const isCancelled = booking.status === 'CANCELLED'
	const showCheckInCode = ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'].includes(
		booking.status,
	)

	return (
		<div className="min-h-dvh bg-zinc-50">
			<header className="border-b bg-white">
				<div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
					<Link to="/" className="flex items-end">
						<span className="text-xl font-extrabold text-rose-700">
							{APP_NAME.slice(0, 4)}
						</span>
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
							<p className="mt-0.5 text-lg font-bold text-zinc-900">
								#{booking.code}
							</p>
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
						{booking.unit.property?.name ? (
							<p>{booking.unit.property.name}</p>
						) : null}
					</div>
				</div>

				{/* Status progress bar */}
				{!isCancelled ? (
					<div className="rounded-xl border bg-white p-6">
						<h3 className="mb-4 text-sm font-semibold text-zinc-900">
							Booking Status
						</h3>
						<div className="relative flex items-center justify-between">
							<div className="absolute top-3 right-0 left-0 h-0.5 bg-zinc-200" />
							<div
								className="absolute top-3 left-0 h-0.5 bg-rose-500 transition-all"
								style={{
									width: `${(Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1)) * 100}%`,
								}}
							/>
							{STATUS_STEPS.map((step, i) => {
								const done = i <= currentStepIndex
								return (
									<div
										key={step}
										className="relative flex flex-col items-center gap-1.5"
									>
										<div
											className={[
												'flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold',
												done
													? 'border-rose-500 bg-rose-500 text-white'
													: 'border-zinc-300 bg-white text-zinc-400',
											].join(' ')}
										>
											{done ? '✓' : i + 1}
										</div>
										<span
											className={[
												'text-xs',
												done ? 'font-medium text-rose-600' : 'text-zinc-400',
											].join(' ')}
										>
											{STATUS_LABELS[step]}
										</span>
									</div>
								)
							})}
						</div>
					</div>
				) : null}

				{/* Check-in code */}
				{showCheckInCode && booking.check_in_code ? (
					<div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
						<p className="text-sm font-medium text-green-800">
							Your Check-In Code
						</p>
						<p className="mt-2 font-mono text-4xl font-extrabold tracking-widest text-green-900">
							{booking.check_in_code}
						</p>
						<p className="mt-2 text-xs text-green-700">
							Show this code to the property manager on arrival.
						</p>
					</div>
				) : null}

				{/* Booking details */}
				<div className="rounded-xl border bg-white p-6">
					<h3 className="mb-4 text-sm font-semibold text-zinc-900">
						Booking Details
					</h3>
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
							<dd className="font-medium">
								{nights} night{nights !== 1 ? 's' : ''}
							</dd>
						</div>
						<div className="border-t pt-2">
							<div className="flex justify-between">
								<dt className="text-zinc-500">Total</dt>
								<dd className="font-semibold">
									{formatAmount(convertPesewasToCedis(total))}
								</dd>
							</div>
						</div>
					</dl>
				</div>

				{/* Property contact */}
				{booking.unit.property?.contact_email ? (
					<div className="rounded-xl border bg-white p-6">
						<h3 className="mb-1 text-sm font-semibold text-zinc-900">
							Contact
						</h3>
						<a
							href={`mailto:${booking.unit.property.contact_email}`}
							className="text-sm text-rose-600 underline"
						>
							{booking.unit.property.contact_email}
						</a>
					</div>
				) : null}
			</main>
		</div>
	)
}
