interface BillingInvoice {
	id: string
	created_at: Date
	updated_at: Date
	amount: number
	currency: string
	status: 'BillingInvoice.Status.Paid' | 'BillingInvoice.Status.Pending'
	due_date: Nullable<Date>
	paid_at: Nullable<Date>
	client_id: string
	client: Client
}
