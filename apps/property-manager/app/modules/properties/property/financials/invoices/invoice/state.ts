import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { getInvoicePayerTypeLabel, paidSoFar, remainingOn } from '~/lib/invoice'

export const fmtDate = (date: Date | string) =>
	localizedDayjs(date).format('D MMMM YYYY')

/** "today", "tomorrow", "in 5 days", "yesterday", "12 days ago". */
export function dayWord(date: Date | string) {
	const target = localizedDayjs(date).startOf('day')
	const days = target.diff(localizedDayjs().startOf('day'), 'day')
	if (days === 0) return 'today'
	if (days === 1) return 'tomorrow'
	if (days === -1) return 'yesterday'
	if (days > 1) return `in ${days} days`
	return `${-days} days ago`
}

export const successfulPayments = (invoice: Invoice) =>
	(invoice.payments ?? [])
		.filter((payment) => payment.status === 'SUCCESSFUL')
		.sort(
			(a, b) =>
				localizedDayjs(a.successful_at ?? a.created_at).valueOf() -
				localizedDayjs(b.successful_at ?? b.created_at).valueOf(),
		)

export type InvoiceStateKey =
	| 'draft'
	| 'open'
	| 'part'
	| 'late'
	| 'paid'
	| 'void'

export interface InvoiceState {
	key: InvoiceStateKey
	/** Short word for the stamp on the sheet. */
	stamp: string
	tone: 'zinc' | 'amber' | 'crimson' | 'green'
	/** The whole page in one sentence, above the sheet. */
	headline: string
	detail: string
}

export function deriveInvoiceState(
	invoice: Invoice,
	payerName?: string,
): InvoiceState {
	const who = payerName || getInvoicePayerTypeLabel(invoice.payer_type)
	const money = (pesewas: number) =>
		formatAmount(convertPesewasToCedis(pesewas), invoice.currency)
	const paid = paidSoFar(invoice)
	const owed = remainingOn(invoice)
	const due = invoice.due_date
	const dueDate = due ? fmtDate(due) : null
	const lateBy = due
		? localizedDayjs()
				.startOf('day')
				.diff(localizedDayjs(due).startOf('day'), 'day')
		: 0
	const overdue = lateBy > 0

	if (invoice.status === 'VOID') {
		return {
			key: 'void',
			stamp: 'Cancelled',
			tone: 'zinc',
			headline: 'This bill was cancelled.',
			detail:
				invoice.voided_reason ||
				'It no longer counts toward anything that is owed.',
		}
	}

	if (invoice.status === 'DRAFT') {
		return {
			key: 'draft',
			stamp: 'Draft',
			tone: 'zinc',
			headline: 'This bill is still a draft.',
			detail: `It has not been sent. Nothing is owed on it until you issue it.`,
		}
	}

	if (owed <= 0 || invoice.status === 'PAID') {
		const last = successfulPayments(invoice).at(-1)
		return {
			key: 'paid',
			stamp: 'Paid',
			tone: 'green',
			headline: `${who} has paid this bill in full — all ${money(invoice.total_amount)}.`,
			detail: last?.successful_at
				? `The last of it came in on ${fmtDate(last.successful_at)}. Nothing is owed on this bill.`
				: 'Nothing is owed on this bill.',
		}
	}

	if (paid > 0) {
		return {
			key: overdue ? 'late' : 'part',
			stamp: overdue ? 'Part paid, late' : 'Part paid',
			tone: overdue ? 'crimson' : 'amber',
			headline: `${who} still owes ${money(owed)} of ${money(invoice.total_amount)}.`,
			detail:
				overdue && dueDate
					? `${money(paid)} has been paid so far, and the rest was due ${dueDate} — ${lateBy} days ago.`
					: dueDate
						? `${money(paid)} paid so far. The rest is due ${dueDate}, ${dayWord(due!)}.`
						: `${money(paid)} paid so far.`,
		}
	}

	if (overdue && dueDate) {
		return {
			key: 'late',
			stamp: 'Late',
			tone: 'crimson',
			headline: `${who} still owes ${money(owed)} — it was due ${dueDate}, ${lateBy} days ago.`,
			detail: 'Nothing has been paid against this bill yet.',
		}
	}

	return {
		key: 'open',
		stamp: 'Not paid yet',
		tone: 'zinc',
		headline: dueDate
			? `${who} owes ${money(owed)}, due ${dueDate} — ${dayWord(due!)}.`
			: `${who} owes ${money(owed)}.`,
		detail: invoice.issued_at
			? `Issued ${fmtDate(invoice.issued_at)}. Nothing has been paid against it yet.`
			: 'Nothing has been paid against it yet.',
	}
}

export function payerNameOf(invoice: Invoice): string | undefined {
	const person = invoice.payer_lease?.tenant
	if (person) {
		return [person.first_name, person.other_names, person.last_name]
			.filter(Boolean)
			.join(' ')
	}
	return invoice.payer_client?.name ?? undefined
}
