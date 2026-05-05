import { differenceInDays, format } from 'date-fns'
import { Link } from 'react-router'
import { APP_NAME } from '~/lib/constants'

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
	unit: PublicBookingUnit
	selectedRange: { from: Date; to: Date } | null
	canSubmit: boolean
	submitting: boolean
	error: string | null
	success: boolean
	trackingCode: string | null
	onSubmit: () => void
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
}: Props) {
	const nights = selectedRange ? differenceInDays(selectedRange.to, selectedRange.from) : 0
	const total = nights * unit.rent_fee

	if (success && trackingCode) {
		return (
			<div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
				<div className="mb-3 text-3xl">✓</div>
				<h3 className="text-base font-semibold text-green-800">
					Booking request submitted!
				</h3>
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
						<span className="font-medium">
							{format(selectedRange.from, 'MMM d, yyyy')}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-zinc-500">Check-out</span>
						<span className="font-medium">
							{format(selectedRange.to, 'MMM d, yyyy')}
						</span>
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
							{formatCurrency(unit.rent_fee, unit.rent_fee_currency)} × {nights} nights
						</span>
						<span className="font-semibold">
							{formatCurrency(total, unit.rent_fee_currency)}
						</span>
					</div>
				</div>
			) : (
				<p className="mt-4 text-sm text-zinc-400">
					Select check-in and check-out dates to see pricing.
				</p>
			)}

			{error ? (
				<p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
					{error}
				</p>
			) : null}

			<button
				onClick={onSubmit}
				disabled={!canSubmit || submitting}
				className="mt-6 w-full rounded-lg bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{submitting ? 'Submitting...' : 'Request Booking'}
			</button>

			<p className="mt-3 text-center text-xs text-zinc-400">
				Powered by <span className="font-medium capitalize">{APP_NAME}</span>
			</p>
		</div>
	)
}
