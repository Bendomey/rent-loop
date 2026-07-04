const FREQUENCY_DAYS: Record<string, number> = {
	DAILY: 1,
	WEEKLY: 7,
	MONTHLY: 30,
	QUARTERLY: 90,
	BIANNUALLY: 180,
	ANNUALLY: 365,
}

function getPeriodDays(frequency: string): number {
	return FREQUENCY_DAYS[frequency.toUpperCase()] ?? 30
}

/**
 * Mirrors the backend's leaseEndDate() (services/main/internal/services/lease.go)
 * for the rare case move_out_date isn't available from the API yet (e.g. a
 * lease predating this field). Falls back to the same open-ended-lease
 * sentinel the backend uses when duration/frequency can't produce a real date.
 */
function computeMoveOutDate(
	moveInDate: Date | string,
	stayDuration: number,
	stayDurationFrequency: string,
): Date {
	if (!stayDuration || !stayDurationFrequency) return new Date('2099-01-01')

	const moveIn = new Date(moveInDate)

	switch (stayDurationFrequency.toLowerCase()) {
		case 'hours':
		case 'hour':
			return new Date(moveIn.getTime() + stayDuration * 60 * 60 * 1000)
		case 'days':
		case 'day':
			return new Date(moveIn.getTime() + stayDuration * 86_400_000)
		case 'months':
		case 'month': {
			const result = new Date(moveIn)
			result.setMonth(result.getMonth() + stayDuration)
			return result
		}
		default:
			return new Date('2099-01-01')
	}
}

/**
 * Returns the lease's move-out date, preferring the value computed and
 * persisted by the backend, and falling back to a client-side computation
 * when it isn't available from the API.
 */
export function getLeaseEndDate(lease: Lease): Date {
	if (lease.move_out_date) return new Date(lease.move_out_date)
	return computeMoveOutDate(
		lease.move_in_date,
		lease.stay_duration,
		lease.stay_duration_frequency,
	)
}

/**
 * Whether the check-in reminder banner should be shown.
 * Shows when: no CHECK_IN exists, or one exists but is still in DRAFT (not yet
 * submitted) AND we're within the first 2 payment periods from move_in_date.
 * A SUBMITTED/ACKNOWLEDGED checklist means it's already handled; DISPUTED gets
 * its own dedicated alert.
 */
export function shouldShowCheckInAlert(
	lease: Lease,
	checklists: LeaseChecklist[],
): boolean {
	const checkIn = checklists.find((c) => c.type === 'CHECK_IN')
	if (checkIn && checkIn.status !== 'DRAFT') return false

	const frequency = lease.payment_frequency ?? lease.stay_duration_frequency
	const periodDays = getPeriodDays(frequency)
	const windowEnd = new Date(
		new Date(lease.move_in_date).getTime() + 2 * periodDays * 86_400_000,
	)

	return new Date() <= windowEnd
}

/**
 * Whether a checklist's move-in/move-out report has been handed off to the
 * tenant (submitted or acknowledged), as opposed to still sitting in DRAFT.
 */
export function isChecklistHandled(status: LeaseChecklistStatus): boolean {
	return status === 'SUBMITTED' || status === 'ACKNOWLEDGED'
}

/**
 * Whether the "lease ending soon" banner should be shown. This banner combines
 * the move-out report reminder with the upcoming renew-lease decision — the
 * renew decision is purely time-based, so it does not depend on any checklist
 * having been created or completed.
 * Shows when:
 * - The lease is still Active
 * - We're within 1 payment period of the lease end date (or past it — the lease
 *   hasn't been renewed yet, so it still needs attention)
 */
export function shouldShowLeaseEndingAlert(lease: Lease): boolean {
	if (lease.status !== 'Lease.Status.Active') return false

	const frequency = lease.payment_frequency ?? lease.stay_duration_frequency
	const periodDays = getPeriodDays(frequency)
	const endDate = getLeaseEndDate(lease)
	const daysUntilEnd = (endDate.getTime() - new Date().getTime()) / 86_400_000

	return daysUntilEnd <= periodDays
}

export function getChecklistStatusLabel(status: LeaseChecklistStatus): string {
	switch (status) {
		case 'DRAFT':
			return 'Draft'
		case 'SUBMITTED':
			return 'Submitted'
		case 'ACKNOWLEDGED':
			return 'Approved'
		case 'DISPUTED':
			return 'Rejected'
	}
}

export function getChecklistStatusClass(status: LeaseChecklistStatus): string {
	switch (status) {
		case 'DRAFT':
			return 'bg-zinc-400 text-white'
		case 'SUBMITTED':
			return 'bg-blue-500 text-white'
		case 'ACKNOWLEDGED':
			return 'bg-teal-500 text-white'
		case 'DISPUTED':
			return 'bg-amber-500 text-white'
	}
}

export function getItemStatusLabel(status: LeaseChecklistItemStatus): string {
	switch (status) {
		case 'PENDING':
			return 'Pending'
		case 'FUNCTIONAL':
			return 'Functional'
		case 'DAMAGED':
			return 'Damaged'
		case 'MISSING':
			return 'Missing'
		case 'NEEDS_REPAIR':
			return 'Needs Repair'
		case 'NOT_PRESENT':
			return 'Not Present'
	}
}

export function getItemStatusClass(status: LeaseChecklistItemStatus): string {
	switch (status) {
		case 'PENDING':
			return 'bg-zinc-400 dark:bg-zinc-600 text-white'
		case 'FUNCTIONAL':
			return 'bg-teal-500 dark:bg-teal-700 text-white'
		case 'DAMAGED':
			return 'bg-rose-500 dark:bg-rose-700 text-white'
		case 'MISSING':
			return 'bg-yellow-500 dark:bg-yellow-700 text-white'
		case 'NEEDS_REPAIR':
			return 'bg-amber-500 dark:bg-amber-700 text-white'
		case 'NOT_PRESENT':
			return 'bg-black text-white'
	}
}

export function getChecklistTypeLabel(type: LeaseChecklistType): string {
	switch (type) {
		case 'CHECK_IN':
			return 'Move-In Report'
		case 'CHECK_OUT':
			return 'Move-Out Report'
		case 'ROUTINE':
			return 'Routine Inspection'
	}
}

export function isChecklistEditable(status: LeaseChecklistStatus): boolean {
	return status === 'DRAFT' || status === 'DISPUTED'
}
