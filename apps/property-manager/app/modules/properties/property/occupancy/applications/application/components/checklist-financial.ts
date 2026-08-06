import type { ChecklistItem } from './checklist-types'

/**
 * The financial step's sub-items.
 *
 * There is no longer a single "the invoice" — an application has a financial
 * account carrying many charges and any number of invoices, so progress is read
 * from the account summary instead:
 *
 *   charges prepared  ->  financial_account is present
 *   money collected   ->  total_settled > 0
 */
export function getFinancialItems(
	application: TenantApplication,
): ChecklistItem[] {
	const account = application.financial_account

	return [
		{ label: 'Agreed rent', done: Boolean(application.rent_fee) },
		{ label: 'Charges created', done: Boolean(account) },
		{
			label: 'Collection plan',
			done: Boolean(account),
		},
		{
			label: 'First payment',
			done: Boolean(account && account.total_settled > 0),
		},
	]
}
