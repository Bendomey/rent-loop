interface Payment {
	id: string
	amount: number
	reference: string
	payment_method: 'CHECK' | 'MOMO' | 'CARD' | 'BANK_DIRECT' | 'OFFLINE'
	status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
	email: string
	tenant_id: string
	tenant: Partial<Tenant>
	unit: Partial<Unit>
	successful_at: Nullable<Date>
	failed_at: Nullable<Date>
	expired_at: Nullable<Date>
	currency: string
	created_at: Date
	updated_at: Date
}

interface FetchPaymentFilter {
	status?: string
	payment_method?: string
}
