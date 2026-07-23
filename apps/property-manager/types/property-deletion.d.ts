interface PropertyDeletionBlockingReason {
	type: 'LEASE' | 'BOOKING' | 'TENANT_APPLICATION'
	status: string
	count: number
	label: string
}

interface PropertyDeletionSummary {
	blocks: number
	units: number
	leases: number
	bookings: number
	tenant_applications: number
}

interface PropertyDeletionEligibility {
	can_delete: boolean
	blocking_reasons: PropertyDeletionBlockingReason[]
	will_be_deleted: PropertyDeletionSummary
}
