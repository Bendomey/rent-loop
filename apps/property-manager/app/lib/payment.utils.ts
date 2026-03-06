export function getPaymentStatusLabel(paymentStatus: Payment['status']) {
	switch (paymentStatus) {
		case 'PENDING':
			return 'Processing'
		case 'SUCCESSFUL':
			return 'Paid'
		case 'FAILED':
			return 'Failed'
		default:
			return 'Unknown'
	}
}

export function getPaymentMethodLabel(
	payment_method: Payment['payment_method'],
): string {
	const labelMap: Record<Payment['payment_method'], string> = {
		CARD: 'Credit Card',
		BANK_DIRECT: 'Bank Transfer',
		OFFLINE: 'Cash',
		CHECK: 'Cheque',
		MOMO: 'Momo',
	}

	return labelMap[payment_method] ?? payment_method
}
