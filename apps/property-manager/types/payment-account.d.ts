interface PaymentAccount {
	id: string
	amount: number
	currency: string
	status: 'PaymentAccount.Status.Active' | 'PaymentAccount.Status.Inactive'
	rail: 'MOMO' | 'BANK_TRANSFER' | 'CARD' | 'OFFLINE'
	owner_type: "PROPERTY_OWNER" | "SYSTEM"
	identifier: string
	is_default: boolean
	created_at: Date
	updated_at: Date
}

interface FetchPaymentAccountFilter {
	rail?: string
	status?: string
	owner_types?: Array<string>
}
