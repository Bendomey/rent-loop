export function getInvoiceStatusLabel(invoiceStatus: Invoice['status']) {
	switch (invoiceStatus) {
		case 'DRAFT':
			return 'Draft'
		case 'ISSUED':
			return 'Issued'
		case 'PARTIALLY_PAID':
			return 'Partially Paid'
		case 'PAID':
			return 'Paid'
		case 'VOID':
			return 'Cancelled'
		default:
			return 'Unknown'
	}
}

export function getInvoicePayerTypeLabel(
	payer_type: Invoice['payer_type'],
): string {
	const labelMap: Record<Invoice['payer_type'], string> = {
		TENANT: 'Tenant',
		TENANT_APPLICATION: 'Applicant',
		PROPERTY_OWNER: 'Owner',
	}

	return labelMap[payer_type] ?? payer_type
}

export function getInvoicePayeeTypeLabel(
	payee_type: Invoice['payee_type'],
): string {
	const labelMap: Record<Invoice['payee_type'], string> = {
		RENTLOOP: 'System',
		PROPERTY_OWNER: 'Owner',
	}

	return labelMap[payee_type] ?? payee_type
}

export function getInvoiceContextTypeLabel(
	context_type: Invoice['context_type'],
): string {
	const labelMap: Record<Invoice['context_type'], string> = {
		TENANT_APPLICATION: 'Application',
		LEASE_RENT: 'Rent',
		MAINTENANCE: 'Maintenance',
		MAINTENANCE_EXPENSE: 'Maintenance Expense',
		SAAS_FEE: 'Platform',
		GENERAL_EXPENSE: 'Expense',
	}

	return labelMap[context_type] ?? context_type
}

export function getInvoiceAllowedRailsLabel(
	payment_method: Invoice['allowed_payment_rails'][number],
): string {
	const labelMap: Record<Invoice['allowed_payment_rails'][number], string> = {
		CARD: 'Credit Card',
		BANK_TRANSFER: 'Bank Transfer',
		OFFLINE: 'Cash',
		MOMO: 'Momo',
	}

	return labelMap[payment_method] ?? payment_method
}

/**
 * What has actually landed on an invoice.
 *
 * There is no amount_paid field — an invoice carries its payments, and only
 * SUCCESSFUL ones count. A pending or failed payment must not reduce the
 * balance, or the UI would offer to collect less than is owed.
 */
export const paidSoFar = (invoice: Invoice) =>
	(invoice.payments ?? [])
		.filter((payment) => payment.status === 'SUCCESSFUL')
		.reduce((sum, payment) => sum + payment.amount, 0)

/** What the invoice still has left on it. Never negative — overpayment is refused. */
export const remainingOn = (invoice: Invoice) =>
	invoice.total_amount - paidSoFar(invoice)
