interface Maintenance {
	id: string
	name: string
	unit_number: string
	status: 'Maintenance.Status.Approved' | 'Maintenance.Status.Pending'
	created_at: Date
	updated_at: Date
}

interface FetchMaintenanceFilter {
	status?: string
}
