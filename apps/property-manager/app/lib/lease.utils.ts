import { localizedDayjs } from './date'

/**
 * How close a term has to be before the product calls it expiring.
 *
 * One number for every surface that asks the question — the Insights card, its
 * drill-down list, the lease-table badge and the lease header tag. They used to
 * disagree (60 and 14), which meant a lease could read Expiring in a table and
 * carry no tag on its own page.
 */
export const EXPIRING_WINDOW_DAYS = 30

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

/**
 * The badge a lease listing shows, which is its stored status overlaid with
 * where it sits in its term:
 *
 * - a lease whose move-out date has passed reads **Ended**, matching a lease
 *   already stored with that status — a term that has run out is not
 *   "expiring";
 * - one ending within the next {@link EXPIRING_WINDOW_DAYS} days reads
 *   **Expiring**;
 * - cancelled and terminated leases keep their own label. They ended
 *   deliberately, and the term overlay would hide why.
 *
 * Open-ended leases carry a far-future sentinel move-out date, so they fall
 * outside both windows and keep their stored status.
 */
/**
 * Days until the term ends, when that is close enough to act on — otherwise
 * null.
 *
 * Cancelled and terminated leases are excluded: they ended deliberately and
 * are not running out.
 */
export function leaseExpiringInDays(
	lease: Pick<Lease, 'status' | 'move_out_date'>,
): Nullable<number> {
	if (
		lease.status !== 'Lease.Status.Active' &&
		lease.status !== 'Lease.Status.Pending'
	) {
		return null
	}
	if (!lease.move_out_date) return null

	const daysLeft = localizedDayjs(lease.move_out_date).diff(
		localizedDayjs(),
		'day',
	)
	if (daysLeft < 0 || daysLeft > EXPIRING_WINDOW_DAYS) return null

	return daysLeft
}

/** Not a stored status — a filter value that stands for the Expiring badge. */
export const EXPIRING_STATUS_FILTER = 'Expiring'

/**
 * Turns the status filter into API params that return what the badges show.
 *
 * Expiring and Ended are worked out from the move-out date on Active leases,
 * so filtering on the stored status alone made "Active" return leases badged
 * Expiring, and offered no way to ask for Expiring at all.
 */
export function leaseStatusFilters(
	status: string | undefined,
	today = localizedDayjs(),
): Pick<
	FetchLeaseFilter,
	'status' | 'move_out_date_from' | 'move_out_date_to'
> {
	if (!status) return {}

	// One day past the window: the badge truncates to whole days, so a midnight
	// move-out 31 days off is still "30 days left".
	const lastExpiringDay = today.add(EXPIRING_WINDOW_DAYS + 1, 'day')

	if (status === EXPIRING_STATUS_FILTER) {
		return {
			status: 'Lease.Status.Active',
			move_out_date_from: today.format('YYYY-MM-DD'),
			move_out_date_to: lastExpiringDay.format('YYYY-MM-DD'),
		}
	}

	if (status === 'Lease.Status.Active') {
		return {
			status,
			move_out_date_from: lastExpiringDay.add(1, 'day').format('YYYY-MM-DD'),
		}
	}

	return { status }
}

export function getLeaseDisplayStatus(
	lease: Pick<Lease, 'status' | 'move_out_date'>,
): { label: string; className: string } {
	const stored = {
		label: getLeaseStatusLabel(lease.status),
		className: getLeaseStatusClass(lease.status),
	}

	if (
		lease.status === 'Lease.Status.Cancelled' ||
		lease.status === 'Lease.Status.Terminated'
	) {
		return stored
	}

	const daysLeft = lease.move_out_date
		? localizedDayjs(lease.move_out_date).diff(localizedDayjs(), 'day')
		: null

	if (lease.status === 'Lease.Status.Completed' || (daysLeft ?? 1) < 0) {
		return {
			label: getLeaseStatusLabel('Lease.Status.Completed'),
			className: getLeaseStatusClass('Lease.Status.Completed'),
		}
	}

	if (daysLeft !== null && daysLeft <= EXPIRING_WINDOW_DAYS) {
		return {
			label: 'Expiring',
			className: 'bg-amber-500 text-white dark:bg-amber-600',
		}
	}

	return stored
}
