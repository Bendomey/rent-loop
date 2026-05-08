interface Admin {
	id: string
	name: string
	email: string
	status: 'Admin.Status.Active' | 'Admin.Status.Inactive'
	phone_number: string
	created_at: Date
	updated_at: Date
}

interface FetchAdminFilter {
	status?: string
}
