/**
 * Why Renew is off, or null when it is on.
 *
 * The button is disabled and says why, never hidden: a manager who came to
 * renew and finds nothing has no way to learn what is wrong. Both facts it
 * checks are already on the loaded lease, so it never offers what the API
 * would refuse.
 */
export function renewBlockedReason(
	lease: Lease,
	/** Terms already renewing from this one. A cancelled one does not block. */
	children: Lease[],
): Nullable<string> {
	if (lease.status === 'Lease.Status.Pending') {
		return 'A pending lease has nothing to renew yet'
	}
	if (
		lease.status === 'Lease.Status.Cancelled' ||
		lease.status === 'Lease.Status.Terminated'
	) {
		return 'Only a lease that is running, or one that ran its course, can be renewed'
	}
	const blocking = children.filter(
		(child) => child.status !== 'Lease.Status.Cancelled',
	)
	if (blocking.length > 0) return 'This lease has already been renewed'
	return null
}
