interface Expense {
	id: string
	code: string
	context_type: string
	property_id: string
	context_lease_id: Nullable<string>
	context_maintenance_request_id: Nullable<string>
	description: string
	amount: number // pesewas
	currency: string
	invoices: Invoice[]
	created_by_client_user_id: Nullable<string>
	created_at: string
	updated_at: string
}

interface FetchExpenseFilter {
	context_type?: 'LEASE' | 'MAINTENANCE'
}
