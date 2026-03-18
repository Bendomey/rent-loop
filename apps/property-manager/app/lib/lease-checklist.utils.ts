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
 * Returns the estimated lease end date based on move_in_date + stay_duration × frequency.
 */
export function getLeaseEndDate(lease: Lease): Date {
	const moveIn = new Date(lease.move_in_date)
	const periodDays = getPeriodDays(lease.stay_duration_frequency)
	return new Date(
		moveIn.getTime() + lease.stay_duration * periodDays * 86_400_000,
	)
}

/**
 * Whether the check-in reminder banner should be shown.
 * Shows when: no submitted/acknowledged CHECK_IN exists AND we're within the first
 * 2 payment periods from move_in_date.
 */
export function shouldShowCheckInAlert(
	lease: Lease,
	checklists: LeaseChecklist[],
): boolean {
	const hasCheckIn = checklists.some((c) => c.type === 'CHECK_IN')
	if (hasCheckIn) return false

	const frequency = lease.payment_frequency ?? lease.stay_duration_frequency
	const periodDays = getPeriodDays(frequency)
	const windowEnd = new Date(
		new Date(lease.move_in_date).getTime() + 2 * periodDays * 86_400_000,
	)

	return new Date() <= windowEnd
}

/**
 * Whether the check-out reminder banner should be shown.
 * Shows when:
 * - CHECK_IN exists in SUBMITTED or ACKNOWLEDGED state
 * - No submitted/acknowledged CHECK_OUT exists
 * - We're within 1 payment period of the lease end date
 */
export function shouldShowCheckOutAlert(
	lease: Lease,
	checklists: LeaseChecklist[],
): boolean {
	const checkIn = checklists.find((c) => c.type === 'CHECK_IN')
	if (
		!checkIn ||
		(checkIn.status !== 'SUBMITTED' && checkIn.status !== 'ACKNOWLEDGED')
	) {
		return false
	}

	const hasCheckOut = checklists.some((c) => c.type === 'CHECK_OUT')
	if (hasCheckOut) return false

	const frequency = lease.payment_frequency ?? lease.stay_duration_frequency
	const periodDays = getPeriodDays(frequency)
	const endDate = getLeaseEndDate(lease)
	const now = new Date()
	const msUntilEnd = endDate.getTime() - now.getTime()
	const daysUntilEnd = msUntilEnd / 86_400_000

	return daysUntilEnd >= 0 && daysUntilEnd <= periodDays
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
