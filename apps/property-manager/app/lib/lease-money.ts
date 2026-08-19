import { remainingOn } from './invoice'

/**
 * Money on a live lease, as one listing.
 *
 * Bills and charges used to be two lists, and every billed item appeared in
 * both — a landlord saw "November rent" twice and had to work out it was the
 * same money. Merging them needs the right unit: not the bill and not the
 * charge, but *a thing they owe and where it has got to*. A bill is then the
 * grouping of things that went out together.
 *
 * The join runs through `charge_instance_id` on the invoice line. Matching on
 * label or amount instead breaks on the case that matters most — two months of
 * identical rent, or a fee re-billed after a void.
 */

export interface BillStatus {
	kind: 'paid' | 'late' | 'today' | 'open'
	label: string
	/** Positive only when `kind` is 'late'. */
	daysLate: number
}

export interface BillGroup {
	invoice: Invoice
	/** The charges this bill claims, resolved from the ledger. */
	lines: ChargeInstance[]
	/** What is left on the bill itself. */
	balance: number
	status: BillStatus
	/** The sum of the charges it claims. */
	total: number
}

/**
 * "Still to come", in date order.
 *
 * Rent collapses into a run because a twelve-month lease is twelve identical
 * rows nobody reads; a fee is its own line. Both are ordered by when they fall
 * due, so a fee dated after the run starts sits after it.
 */
export type ComingItem =
	| { kind: 'fee'; charge: ChargeInstance }
	| { kind: 'run'; run: ChargeInstance[] }

export interface LeaseMoney {
	/** Bills with money still on them, oldest due first. */
	waiting: BillGroup[]
	/** Bills fully paid, most recent first. */
	paid: BillGroup[]
	/** Fees no bill has claimed yet. */
	comingFees: ChargeInstance[]
	/** Rent no bill has claimed yet. */
	comingRent: ChargeInstance[]
	/** The two above interleaved by date, for display. */
	coming: ComingItem[]
	/** Standing bills past their date with money still on them, oldest first. */
	lateBills: BillGroup[]
	/** Overdue charges no standing bill claims — what nothing went out for. */
	lateCharges: ChargeInstance[]
	waitingTotal: number
	waitingLate: number
	comingTotal: number
	paidTotal: number
	owes: number
	lateTotal: number
	paidToDate: number
	/**
	 * The live charges this term is answerable for, after scoping. Anything
	 * deriving from the ledger must read this rather than the account's own
	 * list, or it silently reverts to the whole tenancy.
	 */
	charges: ChargeInstance[]
	/** Live charges — removed ones stay on the record but stop counting. */
	chargeCount: number
	/** What the whole term comes to, removed charges excluded. */
	totalCharged: number
}

const DAY = 86_400_000

const startOfDay = (value: Date | string) => {
	const date = new Date(value)
	return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

/** Removed charges stay on the record but stop counting. */
const isLive = (charge: ChargeInstance) => !charge.voided_at

/** What no bill has claimed yet. A charge can only be billed once. */
const unbilled = (charge: ChargeInstance) =>
	charge.amount - charge.invoiced_amount

/**
 * How a bill reads to a landlord.
 *
 * "Due today" rather than "0 days late": the day it falls due is not a day
 * anyone is behind, and calling it late would be the page picking a fight on
 * the tenant's behalf.
 */
export function billStatus(invoice: Invoice, asAt: Date): BillStatus {
	if (remainingOn(invoice) <= 0)
		return { kind: 'paid', label: 'Paid', daysLate: 0 }

	// A bill can be composed without a due date of its own — the API leaves it
	// optional. It is still owed, so say that rather than reporting on a date
	// that was never set.
	if (!invoice.due_date)
		return { kind: 'open', label: 'Not paid yet', daysLate: 0 }

	const days = Math.round(
		(startOfDay(asAt) - startOfDay(invoice.due_date)) / DAY,
	)

	if (days > 0)
		return {
			kind: 'late',
			label: `${days} ${days === 1 ? 'day' : 'days'} late`,
			daysLate: days,
		}
	if (days === 0) return { kind: 'today', label: 'Due today', daysLate: 0 }
	return {
		kind: 'open',
		label: `Due in ${-days} ${-days === 1 ? 'day' : 'days'}`,
		daysLate: 0,
	}
}

/**
 * What a bill is for, in the landlord's words rather than the ledger's.
 *
 * A bill code means nothing to the person reading it — "INV-2611-0042 is 7 days
 * late" sends them looking it up. Naming the things inside it does not.
 */
export function billLabel(group: BillGroup): string {
	const names = group.lines.map((charge) => charge.name)
	if (names.length === 0) return 'This bill'
	if (names.length === 1) return names[0]!
	return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

export function deriveLeaseMoney(
	summary: AccountSummary,
	invoices: Invoice[],
	asAt: Date,
	/**
	 * Scope to one term. The account spans a whole tenancy — every renewal
	 * shares it — so a renewal's page would otherwise show the parent's rent
	 * and the parent's payments as though they were its own.
	 *
	 * Omit it for the account-wide view.
	 */
	leaseId?: string,
): LeaseMoney {
	const accountLive = summary.charges.filter(isLive)
	const accountById = new Map(accountLive.map((charge) => [charge.id, charge]))

	/*
	 * A charge with no lease_id is not "unscoped data we should hide" — it
	 * belongs to the account rather than to any one term, which is what a
	 * credit, a write-off or a pre-lease charge is. Those must appear in every
	 * term's view, so NULL is included deliberately rather than filtered out.
	 *
	 * This is also why the scoping is done here and not by the API's ?lease_id=
	 * filter: that filter is a strict equality and drops the NULLs. On real
	 * data 157 charges on single-lease accounts carry no lease_id, 48 of them
	 * rent — enough that a strict filter would visibly lose money on the
	 * ordinary single-term lease this page mostly shows.
	 */
	const live = accountLive.filter(
		(charge) =>
			!leaseId || charge.lease_id == null || charge.lease_id === leaseId,
	)
	const byId = new Map(live.map((charge) => [charge.id, charge]))

	const claims = (invoice: Invoice, pool: Map<string, ChargeInstance>) =>
		(invoice.line_items ?? []).some(
			(item) => item.charge_instance_id && pool.has(item.charge_instance_id),
		)

	/*
	 * A bill follows the charges it claims, which is the only link that
	 * survives on real data: every TENANT_APPLICATION invoice — the deposit and
	 * first rent, 66 of them in production — has a null payer_lease_id, so
	 * filtering bills by payer_lease_id would empty the first lease's page.
	 *
	 * The last case matters too. 32 invoices claim no resolvable charge at all,
	 * and dropping anything we cannot attribute would hide them outright. There
	 * is nothing to place them by, so they stay unless payer_lease_id says they
	 * belong to a different term.
	 */
	const inTerm = (invoice: Invoice) => {
		if (!leaseId) return true
		if (claims(invoice, byId)) return true
		if (claims(invoice, accountById)) return false
		return !invoice.payer_lease_id || invoice.payer_lease_id === leaseId
	}

	// A voided bill releases the charges it claimed, so it is not part of the
	// account's story at all — its lines return to "still to come".
	const standing = invoices.filter(
		(invoice) => !invoice.voided_at && inTerm(invoice),
	)

	const groups: BillGroup[] = standing.map((invoice) => {
		// A line whose charge is not in the ledger is skipped rather than
		// guessed at: showing an item we cannot resolve would put a number on
		// screen that nothing behind it agrees with.
		const lines = (invoice.line_items ?? [])
			.map((item) =>
				item.charge_instance_id ? byId.get(item.charge_instance_id) : undefined,
			)
			.filter((charge): charge is ChargeInstance => Boolean(charge))

		return {
			invoice,
			lines,
			balance: remainingOn(invoice),
			status: billStatus(invoice, asAt),
			total: lines.reduce((sum, charge) => sum + charge.amount, 0),
		}
	})

	const dueTime = (invoice: Invoice) =>
		invoice.due_date ? new Date(invoice.due_date).getTime() : 0

	const waiting = groups
		.filter((group) => group.balance > 0)
		.sort((a, b) => dueTime(a.invoice) - dueTime(b.invoice))
	const paid = groups
		.filter((group) => group.balance <= 0)
		.sort((a, b) => dueTime(b.invoice) - dueTime(a.invoice))

	// Both figures come from the same resolved lines, so the late part can
	// never exceed the whole.
	const waitingLines = waiting
		.flatMap((group) => group.lines)
		.filter((charge) => charge.settled_amount < charge.amount)
	const waitingTotal = waitingLines.reduce(
		(sum, charge) => sum + (charge.amount - charge.settled_amount),
		0,
	)
	const waitingLate = waitingLines
		.filter((charge) => startOfDay(charge.due_date) < startOfDay(asAt))
		.reduce((sum, charge) => sum + (charge.amount - charge.settled_amount), 0)

	const byDue = (a: ChargeInstance, b: ChargeInstance) =>
		Date.parse(a.due_date) - Date.parse(b.due_date)

	// Anything a standing bill already claims is shown inside that bill, so it
	// is excluded here by construction rather than by trusting `invoiced_amount`
	// to agree with the lines. Those two should never disagree — but "appears
	// exactly once" is the property this whole page exists to hold, and it
	// should not depend on two fields staying in step.
	const claimed = new Set(groups.flatMap((g) => g.lines.map((c) => c.id)))
	const unclaimed = live.filter(
		(charge) => unbilled(charge) > 0 && !claimed.has(charge.id),
	)
	const comingRent = unclaimed
		.filter((charge) => charge.category === 'RENT')
		.sort(byDue)
	const comingFees = unclaimed
		.filter((charge) => charge.category !== 'RENT')
		.sort(byDue)

	// Fees and rent interleaved by date. The run is keyed on its earliest
	// month, since that is the row the landlord sees when it is collapsed.
	const coming: ComingItem[] = [
		...comingFees.map((charge): ComingItem => ({ kind: 'fee', charge })),
		...(comingRent.length ? [{ kind: 'run' as const, run: comingRent }] : []),
	].sort((a, b) => {
		const at = a.kind === 'fee' ? a.charge.due_date : a.run[0]!.due_date
		const bt = b.kind === 'fee' ? b.charge.due_date : b.run[0]!.due_date
		return Date.parse(at) - Date.parse(bt)
	})

	const overdue = (charge: ChargeInstance) =>
		charge.settled_amount < charge.amount &&
		startOfDay(charge.due_date) < startOfDay(asAt)

	const lateBills = waiting.filter((group) => group.status.kind === 'late')

	// What no standing bill went out for. Excluded by the same `claimed` set the
	// listing uses, so the hero can never name something it is showing inside a
	// bill it also names.
	const lateCharges = live
		.filter((charge) => overdue(charge) && !claimed.has(charge.id))
		.sort(byDue)

	// Late means past its date and not paid — whether or not a bill went out.
	// An unbilled overdue fee is money the tenant owes today, so hiding it
	// behind "nothing has been billed" would understate the figure that the
	// whole page is built around.
	const lateTotal = live
		.filter(
			(charge) =>
				charge.settled_amount < charge.amount &&
				startOfDay(charge.due_date) < startOfDay(asAt),
		)
		.reduce((sum, charge) => sum + (charge.amount - charge.settled_amount), 0)

	return {
		waiting,
		paid,
		comingFees,
		comingRent,
		coming,
		lateBills,
		lateCharges,
		waitingTotal,
		waitingLate,
		comingTotal: unclaimed.reduce((sum, charge) => sum + unbilled(charge), 0),
		paidTotal: paid.reduce((sum, group) => sum + group.invoice.total_amount, 0),
		/*
		 * Derived from the same charges the listing below is built from, so the
		 * hero can never contradict what it sits above. The server's totals are
		 * account-wide by design and cannot be used once the page is scoped to
		 * a term — that mismatch is the whole bug this scoping fixes.
		 *
		 * Unscoped, these are the server's figures: outstanding_amount is
		 * defined as the sum of unsettled non-voided charges, which is exactly
		 * what is summed here.
		 */
		owes: leaseId
			? live.reduce((sum, c) => sum + (c.amount - c.settled_amount), 0)
			: summary.outstanding_amount,
		lateTotal,
		paidToDate: leaseId
			? live.reduce((sum, c) => sum + c.settled_amount, 0)
			: summary.total_settled,
		charges: live,
		chargeCount: live.length,
		totalCharged: live.reduce((sum, charge) => sum + charge.amount, 0),
	}
}
