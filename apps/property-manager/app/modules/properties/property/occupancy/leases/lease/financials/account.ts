import { remainingOn } from '~/lib/invoice'

/** The part of a charge no invoice has claimed yet. */
export const uninvoiced = (charge: ChargeInstance) =>
	charge.amount - charge.invoiced_amount

export { remainingOn } from '~/lib/invoice'

/**
 * Late, not merely unpaid.
 *
 * The API has no overdue status — it is an unpaid invoice whose due date has
 * passed, derived here so it can never go stale in a cache.
 */
export const isOverdue = (invoice: Invoice) =>
	remainingOn(invoice) > 0 &&
	Boolean(invoice.due_date) &&
	new Date(invoice.due_date as Date) < new Date()

/**
 * The money the tenant is late with, not merely the money still owed.
 *
 * Only issued invoices can be late: a charge that has not been billed has
 * nothing to be late for, however old its due date.
 */
export const overdueTotal = (invoices: Invoice[]) =>
	invoices.filter(isOverdue).reduce((sum, i) => sum + remainingOn(i), 0)

export interface NextIssue {
	charge: ChargeInstance
	/** When the plan will cut the invoice — its due date less the lead time. */
	issueOn: Date
	amount: number
	/** One-offs already due that get swept in with it. */
	extras: number
}

/**
 * What the collection plan will bill next.
 *
 * Derived from the first unclaimed rent charge rather than stored, so it can
 * never contradict the ledger printed beside it. Returns null once every rent
 * charge is on an invoice.
 *
 * MANUAL returns null too, and that is the whole point of taking the cadence:
 * the date is only a prediction of what the sweep will do, and the sweep skips
 * a MANUAL account entirely. auto_issue_days_before keeps its stored value —
 * there is nothing to clear — it simply has nothing to act on. Note "whole
 * term up front" also stores MANUAL, since it is a collection action rather
 * than a schedule.
 */
export function nextIssue(
	charges: ChargeInstance[],
	leadDays: number,
	cadence: RentBillingCadence,
): Nullable<NextIssue> {
	if (cadence === 'MANUAL') return null

	const live = charges.filter((c) => !c.voided_at)
	const rent = live
		.filter((c) => c.category === 'RENT' && uninvoiced(c) > 0)
		.sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date))

	const charge = rent[0]
	if (!charge) return null

	const issueOn = new Date(charge.due_date)
	issueOn.setDate(issueOn.getDate() - leadDays)

	// The sweep takes any one-off already due by then along with the rent, so
	// quoting the rent alone would understate the invoice.
	const extras = live
		.filter(
			(c) =>
				c.category !== 'RENT' &&
				uninvoiced(c) > 0 &&
				Date.parse(c.due_date) <= Date.parse(charge.due_date),
		)
		.reduce((sum, c) => sum + uninvoiced(c), 0)

	return { charge, issueOn, amount: uninvoiced(charge) + extras, extras }
}
