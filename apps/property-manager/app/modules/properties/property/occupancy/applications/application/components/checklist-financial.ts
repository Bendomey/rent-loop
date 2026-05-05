import type { ChecklistItem } from './checklist-types'

export function getFinancialItems(
	application: TenantApplication,
): ChecklistItem[] {
	const invoice = application.application_payment_invoice

	return [
		{ label: 'Rent fee', done: Boolean(application.rent_fee) },
		{
			label: 'Payment frequency',
			done: Boolean(application.payment_frequency),
		},
		{
			label: 'Invoice generated',
			done: Boolean(invoice),
		},
		{
			label: 'Invoice paid',
			done: invoice?.status === 'PAID',
		},
	]
}
