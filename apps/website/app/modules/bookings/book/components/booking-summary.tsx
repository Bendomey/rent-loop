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
					'Reserve Now'
				)}
			</button>

			<p className="mt-3 text-center text-xs text-zinc-400">
				Powered by <span className="font-medium capitalize">{APP_NAME}</span>
			</p>
		</div>
	)
}
