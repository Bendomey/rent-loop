type ExpenseStatus = 'OUTSTANDING' | 'PARTIALLY_SETTLED' | 'SETTLED' | 'VOIDED'

type ExpenseCategory =
	| 'REPAIRS'
	| 'UTILITIES'
	| 'INSURANCE'
	| 'LANDSCAPING'
	| 'SECURITY'
	| 'MANAGEMENT'
	| 'OTHER'

interface Expense {
	id: string
	code: string
	context_type: 'MAINTENANCE' | 'GENERAL'
	// Derived server-side from the financial line the expense came from; the
	// expense itself holds no request foreign key.
	maintenance_request_id: Nullable<string>
	property_id: string
	category: ExpenseCategory
	vendor_name: Nullable<string>
	vendor_contact: Nullable<string>
	description: string
	amount: number // pesewas
	currency: string
	// Derived server-side, never stored. is_editable is the same guard the API
	// enforces, so the UI can stop offering an edit that would be refused.
	status: ExpenseStatus
	is_editable: boolean
	invoice_id: Nullable<string>
	invoice?: Nullable<Invoice>
	voided_at: Nullable<string>
	voided_reason: Nullable<string>
	created_by_client_user_id: string
	created_at: string
	updated_at: string
}

interface FetchExpenseFilter {
	context_type?: 'MAINTENANCE' | 'GENERAL'
	category?: ExpenseCategory
}
