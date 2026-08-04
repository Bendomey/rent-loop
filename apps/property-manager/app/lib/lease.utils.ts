import { localizedDayjs } from './date'

/** Mirrors the Insights risk-summary "leases expiring" window. */
const EXPIRING_SOON_WINDOW_DAYS = 60

export function getLeaseStatusLabel(status: Lease['status']) {
	switch (status) {
		case 'Lease.Status.Pending':
			return 'Pending'
		case 'Lease.Status.Active':
			return 'Active'
		case 'Lease.Status.Completed':
			return 'Completed'
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
 * - a lease whose move-out date has passed reads **Completed**, matching a
 *   lease already stored with that status — a term that has run out is not
 *   "expiring";
 * - one ending within the next {@link EXPIRING_SOON_WINDOW_DAYS} days reads
 *   **Expiring**;
 * - cancelled and terminated leases keep their own label. They ended
 *   deliberately, and the term overlay would hide why.
 *
 * Open-ended leases carry a far-future sentinel move-out date, so they fall
 * outside both windows and keep their stored status.
 */
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

	if (daysLeft !== null && daysLeft <= EXPIRING_SOON_WINDOW_DAYS) {
		return {
			label: 'Expiring',
			className: 'bg-amber-500 text-white dark:bg-amber-600',
		}
	}

	return stored
}
