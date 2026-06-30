import { format } from 'date-fns'
import { Link } from 'react-router'
import { calcUnits, UNIT_PLURAL, UNIT_SINGULAR } from '~/lib/booking-duration'
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
	MOMO: 'Mobile Money',
	CARD: 'Card',
	BANK_DIRECT: 'Bank Transfer',
	OFFLINE: 'Offline',
	CHECK: 'Cheque',
}

const PAYMENT_STATUS_CLASSES: Record<string, string> = {
	SUCCESSFUL: 'bg-green-100 text-green-700',
	PENDING: 'bg-yellow-100 text-yellow-700',
	FAILED: 'bg-red-100 text-red-700',
}

interface Props {
	booking: Booking
}

export function BookingDetails({ booking }: Props) {
	const checkIn = new Date(booking.check_in_date)
	const checkOut = new Date(booking.check_out_date)
	const frequency = booking.stay_frequency ?? 'DAILY'
	const units = calcUnits(frequency, checkIn, checkOut)
	const unitLabel =
		units === 1 ? UNIT_SINGULAR[frequency] : UNIT_PLURAL[frequency]

	const currentStepIndex = STATUS_STEPS.indexOf(
		booking.status as Exclude<BookingStatus, 'CANCELLED'>,
	)
	const isCancelled = booking.status === 'CANCELLED'
	const showCheckInCode =
		booking.status === 'CONFIRMED' && !!booking.check_in_code

	const invoice = booking.invoice
	const lineItems = invoice?.line_items ?? []
	const payments = invoice?.payments ?? []

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
						{booking.unit?.name ? <p>{booking.unit.name}</p> : null}
						{booking.unit?.property?.name ? (
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

				{/* Check-in code — only shown while CONFIRMED, hidden after check-in */}
				{showCheckInCode ? (
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
								{units} {unitLabel}
							</dd>
						</div>
					</dl>
				</div>

				{/* Invoice */}
				{invoice ? (
					<div className="rounded-xl border bg-white p-6">
						<div className="mb-4 flex items-center justify-between">
							<h3 className="text-sm font-semibold text-zinc-900">Invoice</h3>
							<span
								className={[
									'rounded-full px-2.5 py-0.5 text-xs font-medium',
									invoice.status === 'PAID'
										? 'bg-green-100 text-green-700'
										: 'bg-yellow-100 text-yellow-700',
								].join(' ')}
							>
								{invoice.status === 'PAID' ? 'Paid' : 'Unpaid'}
							</span>
						</div>

						{lineItems.length > 0 ? (
							<div className="space-y-2">
								{lineItems.map((item) => (
									<div
										key={item.id}
										className="flex items-start justify-between text-sm"
									>
										<div>
											<p className="font-medium text-zinc-900">{item.label}</p>
											{item.quantity > 1 && (
												<p className="text-xs text-zinc-400">
													{item.quantity} ×{' '}
													{formatAmount(
														convertPesewasToCedis(item.unit_amount),
													)}
												</p>
											)}
										</div>
										<p className="font-medium text-zinc-900">
											{formatAmount(convertPesewasToCedis(item.total_amount))}
										</p>
									</div>
								))}
							</div>
						) : null}

						<div className="mt-4 flex justify-between border-t pt-3 text-sm">
							<span className="font-semibold text-zinc-900">Total</span>
							<span className="font-bold text-zinc-900">
								{formatAmount(convertPesewasToCedis(invoice.total_amount))}
							</span>
						</div>
					</div>
				) : null}

				{/* Payment records */}
				{payments.length > 0 ? (
					<div className="rounded-xl border bg-white p-6">
						<h3 className="mb-4 text-sm font-semibold text-zinc-900">
							Payments
						</h3>
						<div className="space-y-3">
							{payments.map((p) => (
								<div
									key={p.id}
									className="flex items-center justify-between text-sm"
								>
									<div>
										<p className="font-medium text-zinc-900">
											{PAYMENT_METHOD_LABELS[p.payment_method] ??
												p.payment_method}
										</p>
										<p className="text-xs text-zinc-400">
											{p.successful_at
												? format(new Date(p.successful_at), 'MMM d, yyyy')
												: format(new Date(p.created_at), 'MMM d, yyyy')}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<span
											className={[
												'rounded-full px-2 py-0.5 text-xs font-medium',
												PAYMENT_STATUS_CLASSES[p.status] ??
													'bg-zinc-100 text-zinc-500',
											].join(' ')}
										>
											{p.status.charAt(0) + p.status.slice(1).toLowerCase()}
										</span>
										<span className="font-semibold text-zinc-900">
											{formatAmount(convertPesewasToCedis(p.amount))}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				) : null}

				{/* Property contact */}
				{booking.unit?.property?.contact_email ? (
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
