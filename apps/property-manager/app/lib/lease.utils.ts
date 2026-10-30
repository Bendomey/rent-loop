import { localizedDayjs } from './date'

/**
 * How many days before its move-out a lease reads Expiring, by the unit its
 * term is measured in. A flat month called a three-day stay expiring from the
 * day it began. The column holds both the payment-frequency words and the
 * older duration words.
 *
 * The API's `expiring` filter and the Leases cube apply the same table, so the
 * badge, the Expiring filter and the Insights counts agree — change all three
 * together.
 */
export function expiringWindowDays(
	stayFrequency: Nullable<string> | undefined,
): number {
	switch (stayFrequency?.toLowerCase()) {
		case 'hourly':
		case 'hours':
		case 'hour':
			return 0
		case 'daily':
		case 'days':
		case 'day':
			return 1
		case 'weekly':
		case 'weeks':
		case 'week':
			return 3
		default:
			return 30
	}
}

export function getLeaseStatusLabel(status: Lease['status']) {
	switch (status) {
		case 'Lease.Status.Pending':
			return 'Pending'
		case 'Lease.Status.Active':
			return 'Active'
		case 'Lease.Status.Completed':
			// "Ended" rather than "Completed": a term that ran its course is
			// simply over, and "completed" reads like something was achieved.
			return 'Ended'
		case 'Lease.Status.Cancelled':
			return 'Cancelled'
		case 'Lease.Status.Terminated':
			return 'Terminated'
		default:
			return status
	}
}

export function getLeaseStatusClass(status: Lease['status']) {
	switch (status) {
		case 'Lease.Status.Pending':
			return 'bg-yellow-500 text-white'
		case 'Lease.Status.Active':
			return 'bg-teal-500 text-white'
		case 'Lease.Status.Completed':
			return 'bg-blue-500 text-white'
		case 'Lease.Status.Cancelled':
			return 'bg-zinc-400 text-white'
		case 'Lease.Status.Terminated':
			return 'bg-rose-500 text-white'
		default:
			return ''
	}
}

type LeaseTerm = Pick<
	Lease,
	'status' | 'move_out_date' | 'stay_duration_frequency'
>

/**
 * Whole days until the move-out — negative once it has passed — or null when
 * there is none, or when the lease ended deliberately and the term overlay
 * would hide why.
 */
function daysLeftInTerm(lease: LeaseTerm): Nullable<number> {
	if (
		(lease.status !== 'Lease.Status.Active' &&
			lease.status !== 'Lease.Status.Pending') ||
		!lease.move_out_date
	)
		return null

	return localizedDayjs(lease.move_out_date).diff(localizedDayjs(), 'day')
}

/**
 * Days until the term ends, when inside its expiring window — otherwise null.
 * Only an Active lease can be running out; a Pending one has not started.
 */
export function leaseExpiringInDays(lease: LeaseTerm): Nullable<number> {
	if (lease.status !== 'Lease.Status.Active') return null
	const daysLeft = daysLeftInTerm(lease)
	if (daysLeft === null) return null
	if (
		daysLeft < 0 ||
		daysLeft > expiringWindowDays(lease.stay_duration_frequency)
	)
		return null

	return daysLeft
}

/** Not a stored status — a filter value that stands for the Expiring badge. */
export const EXPIRING_STATUS_FILTER = 'Expiring'

/**
 * Turns the status filter into API params that return what the badges show.
 *
 * Expiring and Ended are worked out from the move-out date on Active leases,
 * so filtering on the stored status alone made "Active" return leases badged
 * Expiring, and offered no way to ask for Expiring at all. The window differs
 * per lease, so the API applies it rather than a date range sent from here.
 */
export function leaseStatusFilters(
	status: string | undefined,
): Pick<FetchLeaseFilter, 'status' | 'expiring'> {
	if (!status) return {}

	if (status === EXPIRING_STATUS_FILTER) {
		return { status: 'Lease.Status.Active', expiring: true }
	}

	if (status === 'Lease.Status.Active') {
		return { status, expiring: false }
	}

	return { status }
}

/**
 * The badge a lease listing shows, which is its stored status overlaid with
 * where the lease sits in its term:
 *
 * - past its move-out date it reads **Ended**, matching a lease already stored
 *   with that status. That includes a Pending lease nobody started: left as
 *   Pending it reads as about to begin, for a term that is already over;
 * - an Active lease inside its {@link expiringWindowDays} reads **Expiring**.
 *   A Pending one stays Pending — it cannot run out before it starts.
 *
 * Cancelled and terminated leases keep their own label. Open-ended leases
 * carry a far-future sentinel move-out date, so they fall outside both.
 */
export function getLeaseDisplayStatus(lease: LeaseTerm): {
	label: string
	className: string
} {
	const stored = {
		label: getLeaseStatusLabel(lease.status),
		className: getLeaseStatusClass(lease.status),
	}

	const daysLeft = daysLeftInTerm(lease)
	if (daysLeft === null) return stored

	if (daysLeft < 0) {
		return {
			label: getLeaseStatusLabel('Lease.Status.Completed'),
			className: getLeaseStatusClass('Lease.Status.Completed'),
		}
	}

	if (
		lease.status === 'Lease.Status.Active' &&
		daysLeft <= expiringWindowDays(lease.stay_duration_frequency)
	) {
		return {
			label: 'Expiring',
			className: 'bg-amber-500 text-white dark:bg-amber-600',
		}
	}

	return stored
}
