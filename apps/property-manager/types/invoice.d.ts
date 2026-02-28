interface InvoiceLineItem {
	id: string
	invoice_id: Nullable<string>
	label: string
	category: string
	quantity: number
	unit_amount: number
	total_amount: number
	currency: string
	metadata: Nullable<StringRecord>
	created_at: Date
	updated_at: Date
}

type PAYMENT_RAIL = 'MOMO' | 'BANK_TRANSFER' | 'OFFLINE' | 'CARD'

interface Invoice {
	id: string
	code: string
	payer_type: 'TENANT' | 'TENANT_APPLICATION' | 'PROPERTY_OWNER'
	payer_client_id: Nullable<string>
	payer_client: Nullable<Client>
	payer_property_id: Nullable<string>
	payer_property: Nullable<Property>
	payer_tenant_id: Nullable<string>
	payer_tenant: Nullable<Tenant>
	payee_type: 'PROPERTY_OWNER' | 'RENTLOOP'
	payee_client_id: Nullable<string>
	payee_client: Nullable<Client>
	context_type:
		| 'TENANT_APPLICATION'
		| 'LEASE_RENT'
		| 'MAINTENANCE'
		| 'SAAS_FEE'
		| 'GENERAL_EXPENSE'
	context_tenant_application_id: Nullable<string>
	context_tenant_application: Nullable<TenantApplication>
	context_lease: Nullable<Lease>
	context_lease_id: Nullable<string>
	context_maintenance_request_id: Nullable<string>
	total_amount: number
	taxes: number
	sub_total: number
	currency: string
	status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'
	due_date: Nullable<Date>
	issued_at: Nullable<Date>
	paid_at: Nullable<Date>
	voided_at: Nullable<Date>
	allowed_payment_rails: Array<PAYMENT_RAIL>
	line_items: Array<InvoiceLineItem>
	created_at: Date
	updated_at: Date
}

interface FetchInvoiceFilter {
	payee_type?: string
	payer_type?: string
	status?: string
}
