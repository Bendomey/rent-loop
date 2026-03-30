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
