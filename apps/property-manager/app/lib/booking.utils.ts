import dayjs from 'dayjs'

/** Returns duration count + period label for a booking based on stay_frequency. DAILY uses "nights". */
export function getBookingDuration(
	checkIn: Date | string,
	checkOut: Date | string,
	frequency: string,
): { count: number; label: string } {
	const inD = dayjs(checkIn)
	const outD = dayjs(checkOut)
	switch (frequency?.toUpperCase()) {
		case 'WEEKLY': {
			const count = Math.ceil(outD.diff(inD, 'week', true))
			return { count, label: count === 1 ? 'week' : 'weeks' }
		}
		case 'MONTHLY': {
			const count = Math.ceil(outD.diff(inD, 'month', true))
			return { count, label: count === 1 ? 'month' : 'months' }
		}
		default: {
			const count = outD.diff(inD, 'day')
			return { count, label: count === 1 ? 'day' : 'days' }
		}
	}
}

/** Returns the rate label for the payment breakdown line item, e.g. "Daily rate". */
export function getBookingRateLabel(frequency: string): string {
	switch (frequency?.toUpperCase()) {
		case 'WEEKLY':
			return 'Weekly rate'
		case 'MONTHLY':
			return 'Monthly rate'
		default:
			return 'Daily rate'
	}
}

/** Returns the frequency suffix for rate display, e.g. "/night", "/week", "/month". */
export function getBookingRateFrequencySuffix(frequency: string): string {
	switch (frequency?.toUpperCase()) {
		case 'WEEKLY':
			return '/week'
		case 'MONTHLY':
			return '/month'
		default:
			return '/day'
	}
}
