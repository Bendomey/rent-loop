import { Smartphone, Landmark, CreditCard, Store } from 'lucide-react'
import type { ElementType } from 'react'

export function getPaymentAccountStatusLabel(
	propertyStatus: PaymentAccount['status'],
) {
	switch (propertyStatus) {
		case 'PaymentAccount.Status.Active':
			return 'Active'
		case 'PaymentAccount.Status.Inactive':
			return 'Inactive'
		default:
			return 'Unknown'
	}
}

export function getPaymentAccountTypeLabel(
	account_type: PaymentAccount['rail'],
): string {
	const labelMap: Record<PaymentAccount['rail'], string> = {
		MOMO: 'Momo',
		OFFLINE: 'Cash',
		BANK_TRANSFER: 'Bank Transfer',
		CARD: 'Credit Card',
	}

	return labelMap[account_type] ?? account_type
}

export const paymentIcons: Record<PaymentAccount['rail'], ElementType> = {
	MOMO: Smartphone,
	OFFLINE: Store,
	BANK_TRANSFER: Landmark,
	CARD: CreditCard,
}
