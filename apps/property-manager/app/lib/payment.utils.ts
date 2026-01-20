export function getPaymentStatusLabel(paymentStatus: Payment['status']) {
	switch (paymentStatus) {
		case 'Payment.Status.Pending':
			return 'Processing'
		case 'Payment.Status.Successful':
			return 'Paid'
		case 'Payment.Status.Failed':
			return 'Failed'
		case 'Payment.Status.Expired':
			return 'Overdue'
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
