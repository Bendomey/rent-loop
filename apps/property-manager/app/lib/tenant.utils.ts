const ID_TYPE_LABELS: Record<string, string> = {
	DRIVER_LICENSE: "Driver's License",
	PASSPORT: 'Passport',
	NATIONAL_ID: 'National ID',
	GHANA_CARD: 'Ghana Card',
}

export function getIdTypeLabel(idType?: string | null): string | undefined {
	if (!idType) return undefined
	return ID_TYPE_LABELS[idType] ?? idType
}

/**
 * Derives a simple occupancy badge state from a tenant's most relevant lease
 * and booking for the current property: ACTIVE if either is currently
 * active/confirmed, otherwise INACTIVE.
 */
export function getTenantOccupancyStatus(
	tenant: Pick<Tenant, 'recent_lease' | 'recent_booking'>,
): 'ACTIVE' | 'INACTIVE' {
	if (
		tenant.recent_lease?.status === 'Lease.Status.Active' ||
		tenant.recent_lease?.status === 'Lease.Status.Pending'
	)
		return 'ACTIVE'
	if (
		tenant.recent_booking?.status === 'CONFIRMED' ||
		tenant.recent_booking?.status === 'CHECKED_IN'
	) {
		return 'ACTIVE'
	}
	return 'INACTIVE'
}
