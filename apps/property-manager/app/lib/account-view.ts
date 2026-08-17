/**
 * What the running view says, derived from the ledger and the day we are
 * standing on.
 *
 * Never a literal beside a live list: every figure here comes from the charges
 * themselves, so the sentence at the top of the page cannot drift from the
 * rows underneath it.
 */
export interface NextBill {
	/** When the bill goes out — `leadDays` before it falls due. */
	issueOn: Date
	dueOn: Date
	/** The rent, plus any fee already due that will ride along with it. */
	amount: number
	/** The rent charge's own name, so the UI never re-derives a period label. */
	rentLabel: string
	feeNames: string[]
}

export interface AccountView {
	owed: number
	lateTotal: number
	paid: number
	next: NextBill | null
}

/** Removed charges stay on the record but stop counting. */
const isLive = (charge: ChargeInstance) => !charge.voided_at

/** What no invoice has claimed yet. A charge can only be invoiced once. */
const uninvoiced = (charge: ChargeInstance) =>
	charge.amount - charge.invoiced_amount

export function deriveAccountView(
	summary: AccountSummary,
	{ asAt, leadDays }: { asAt: Date; leadDays: number },
): AccountView {
	const live = summary.charges.filter(isLive)

	// Late means past its due date and not paid — whether or not a bill went
	// out for it. An unbilled charge the tenant already owes is still late.
	const lateTotal = live
		.filter(
			(charge) =>
				charge.settled_amount < charge.amount &&
				new Date(charge.due_date) < asAt,
		)
		.reduce((sum, charge) => sum + (charge.amount - charge.settled_amount), 0)

	const byDue = (a: ChargeInstance, b: ChargeInstance) =>
		new Date(a.due_date).getTime() - new Date(b.due_date).getTime()

	const nextRent = live
		.filter((charge) => charge.category === 'RENT' && uninvoiced(charge) > 0)
		.sort(byDue)[0]

	let next: NextBill | null = null
	if (nextRent) {
		const dueOn = new Date(nextRent.due_date)
		const issueOn = new Date(dueOn.getTime())
		issueOn.setUTCDate(issueOn.getUTCDate() - leadDays)

		// F5 — the first bill is never rent alone. Every fee already due rides
		// along with it, so quoting the rent by itself understates what the
		// tenant is about to be asked for.
		const fees = live
			.filter(
				(charge) =>
					charge.category !== 'RENT' &&
					uninvoiced(charge) > 0 &&
					new Date(charge.due_date) <= dueOn,
			)
			.sort(byDue)

		next = {
			issueOn,
			dueOn,
			amount:
				uninvoiced(nextRent) +
				fees.reduce((sum, fee) => sum + uninvoiced(fee), 0),
			rentLabel: nextRent.name,
			feeNames: fees.map((fee) => fee.name),
		}
	}

	// Read off the summary rather than re-summing: these are the server's own
	// totals, and a second opinion here could only ever disagree with it.
	return {
		owed: summary.outstanding_amount,
		lateTotal,
		paid: summary.total_settled,
		next,
	}
}
