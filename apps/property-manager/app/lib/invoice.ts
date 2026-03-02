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
			return 'Empty'
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

export function getInvoiceContextTypeLabel(
	context_type: Invoice['context_type'],
): string {
	const labelMap: Record<Invoice['context_type'], string> = {
		TENANT_APPLICATION: 'Application',
		LEASE_RENT: 'Rent',
		MAINTENANCE: 'Maintenance',
		SAAS_FEE: 'Platform',
		GENERAL_EXPENSE: 'Expense',
	}

	return labelMap[context_type] ?? context_type
}
