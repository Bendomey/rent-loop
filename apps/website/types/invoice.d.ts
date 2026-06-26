interface InvoiceLineItem {
	id: string
	invoice_id: Nullable<string>
	label: string
	category: string
	quantity: number
	unit_amount: number
	total_amount: number
	currency: string
	created_at: string
}

type PaymentMethod = 'CHECK' | 'MOMO' | 'CARD' | 'BANK_DIRECT' | 'OFFLINE'
type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED'

interface InvoicePayment {
	id: string
	amount: number
	reference: string
	payment_method: PaymentMethod
	status: PaymentStatus
	currency: string
	successful_at: Nullable<string>
	created_at: string
}

interface Invoice {
	id: string
	code: string
	total_amount: number
	sub_total: number
	taxes: number
	currency: string
	status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'
	due_date: Nullable<string>
	line_items: Array<InvoiceLineItem>
	payments: Array<InvoicePayment>
}
