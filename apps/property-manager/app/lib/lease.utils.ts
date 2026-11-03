import { localizedDayjs } from './date'

const DAY_MS = 86_400_000

/**
 * How long before its move-out a lease reads Expiring, tiered by the length of
 * the stay. How it is paid, or the unit the term was typed in, says nothing
 * about how much notice a landlord needs — and a flat month called a one-month
 * lease expiring from its first day.
 *
 * The API's `expiring` filter and the Leases cube apply the same tiers, so the
 * badge, the Expiring filter and the Insights counts agree — change all three
 * together.
 */
export function expiringWindowMs(
	lease: Pick<Lease, 'move_in_date' | 'move_out_date'>,
): number {
	const stayMs =
		lease.move_in_date && lease.move_out_date
			? new Date(lease.move_out_date).getTime() -
				new Date(lease.move_in_date).getTime()
			: Infinity

	if (stayMs < 7 * DAY_MS) return DAY_MS
	if (stayMs < 30 * DAY_MS) return 3 * DAY_MS
	if (stayMs < 90 * DAY_MS) return 7 * DAY_MS
	return 30 * DAY_MS
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

type LeaseTerm = Pick<Lease, 'status' | 'move_in_date' | 'move_out_date'>

type TermPosition = 'running' | 'expiring' | 'ended'

/**
 * Where a lease sits in its term, compared to the millisecond so the badge and
 * the API filter split leases at exactly the same instant. Null when it has no
 * move-out, or ended deliberately and the term overlay would hide why.
 *
 * A Pending lease can end — its dates can pass unstarted — but it cannot be
 * running out before it starts.
 */
function termPosition(lease: LeaseTerm): Nullable<TermPosition> {
	if (
		(lease.status !== 'Lease.Status.Active' &&
			lease.status !== 'Lease.Status.Pending') ||
		!lease.move_out_date
	)
		return null

	const msLeft = new Date(lease.move_out_date).getTime() - Date.now()
	if (msLeft <= 0) return 'ended'
	if (
		lease.status === 'Lease.Status.Active' &&
		msLeft <= expiringWindowMs(lease)
	)
		return 'expiring'
	return 'running'
}

/** Whole days until the term ends, while it is Expiring — otherwise null. */
export function leaseExpiringInDays(lease: LeaseTerm): Nullable<number> {
	if (termPosition(lease) !== 'expiring') return null

	return localizedDayjs(lease.move_out_date).diff(localizedDayjs(), 'day')
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
 * - an Active lease inside its {@link expiringWindowMs} reads **Expiring**.
 *
 * Cancelled and terminated leases keep their own label. Open-ended leases
 * carry a far-future sentinel move-out date, so they fall outside both.
 */
export function getLeaseDisplayStatus(lease: LeaseTerm): {
	label: string
	className: string
} {
	switch (termPosition(lease)) {
		case 'ended':
			return {
				label: getLeaseStatusLabel('Lease.Status.Completed'),
				className: getLeaseStatusClass('Lease.Status.Completed'),
			}
		case 'expiring':
			return {
				label: 'Expiring',
				className: 'bg-amber-500 text-white dark:bg-amber-600',
			}
		default:
			return {
				label: getLeaseStatusLabel(lease.status),
				className: getLeaseStatusClass(lease.status),
			}
	}
}
