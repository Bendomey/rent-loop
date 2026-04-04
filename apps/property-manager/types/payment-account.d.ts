interface PaymentAccountMetadata {
	account_name?: string
	bank_name?: string
	branch?: string
	description?: string
}

interface PaymentAccount {
	id: string
	amount: number
	currency: string
	status: 'ACTIVE' | 'INACTIVE'
	rail: 'MOMO' | 'BANK_TRANSFER' | 'CARD' | 'OFFLINE'
	owner_type: 'PROPERTY_OWNER' | 'SYSTEM'
	provider: 'MTN' | 'VODAFONE' | 'AIRTELTIGO' | 'PAYSTACK' | 'BANK_API' | 'CASH'
	identifier: string
	metadata?: PaymentAccountMetadata
	is_default: boolean
	created_at: Date
	updated_at: Date
}

interface FetchPaymentAccountFilter {
	rail?: string
	status?: string
	owner_types?: Array<string>
}
