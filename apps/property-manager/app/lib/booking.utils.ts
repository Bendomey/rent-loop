import dayjs from 'dayjs'

/** Returns duration count + period label for a booking based on stay_frequency. DAILY uses "days". */
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
		case 'QUARTERLY': {
			const count = Math.ceil(outD.diff(inD, 'month', true) / 3)
			return { count, label: count === 1 ? 'quarter' : 'quarters' }
		}
		case 'BIANNUALLY': {
			const count = Math.ceil(outD.diff(inD, 'month', true) / 6)
			return { count, label: count === 1 ? '6 months' : '6-month periods' }
		}
		case 'ANNUALLY': {
			const count = Math.ceil(outD.diff(inD, 'year', true))
			return { count, label: count === 1 ? 'year' : 'years' }
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
		case 'QUARTERLY':
			return 'Quarterly rate'
		case 'BIANNUALLY':
			return 'Biannual rate'
		case 'ANNUALLY':
			return 'Annual rate'
		default:
			return 'Daily rate'
	}
}

/** Returns a short description of the calendar selection mode for a given frequency. */
export function getCalendarPickerHint(frequency: string): string {
	switch (frequency?.toUpperCase()) {
		case 'WEEKLY':
			return 'Weekly — selection snaps to full 7-day periods'
		case 'MONTHLY':
			return 'Monthly — pick a start and end month'
		case 'QUARTERLY':
			return 'Quarterly — selection snaps to 3-month blocks'
		case 'BIANNUALLY':
			return 'Biannual — selection snaps to 6-month blocks'
		case 'ANNUALLY':
			return 'Annual — selection snaps to full years'
		default:
			return 'Daily — select exact check-in and check-out dates'
	}
}

/** Returns the frequency suffix for rate display, e.g. "/day", "/week", "/month". */
export function getBookingRateFrequencySuffix(frequency: string): string {
	switch (frequency?.toUpperCase()) {
		case 'WEEKLY':
			return '/week'
		case 'MONTHLY':
			return '/month'
		case 'QUARTERLY':
			return '/quarter'
		case 'BIANNUALLY':
			return '/6 months'
		case 'ANNUALLY':
			return '/year'
		default:
			return '/day'
	}
}
