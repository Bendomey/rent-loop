export type DisplayTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger'

export interface DisplayStatus {
	label: string
	tone: DisplayTone
}

/**
 * What the landlord reads for a charge. Derived from the API's status, which is
 * itself derived server-side from invoiced_amount, settled_amount and voided_at
 * — never stored.
 */
export const chargeDisplayStatus = (charge: ChargeInstance): DisplayStatus => {
	switch (charge.status) {
		case 'PARTIALLY_INVOICED':
			return { label: 'Part billed', tone: 'warning' }
		case 'INVOICED':
			return { label: 'Billed', tone: 'info' }
		case 'PARTIALLY_SETTLED':
			return { label: 'Part paid', tone: 'warning' }
		case 'SETTLED':
			return { label: 'Paid', tone: 'success' }
		case 'VOID':
			return { label: 'Removed', tone: 'neutral' }
		case 'OUTSTANDING':
			return { label: 'Not yet billed', tone: 'neutral' }
		// Runtime guard only: the union above is exhaustive today, but the API
		// can add a status without the client knowing.
		default:
			return { label: 'Not yet billed', tone: 'neutral' }
	}
}

/**
 * What the landlord reads for an invoice.
 *
 * Invoices and charges use different vocabularies that overlap in spelling — an
 * invoice is ISSUED where a charge is INVOICED — so this must switch on the
 * invoice's own set. "Overdue" is not a status at all: the server has no such
 * concept, it is an unpaid invoice whose due date has passed.
 */
export const invoiceDisplayStatus = (
	invoice: Invoice,
	now: Date = new Date(),
): DisplayStatus => {
	const unpaid =
		invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID'
	if (unpaid && invoice.due_date && new Date(invoice.due_date) < now) {
		return { label: 'Overdue', tone: 'danger' }
	}
	switch (invoice.status) {
		case 'DRAFT':
			return { label: 'Draft', tone: 'neutral' }
		case 'ISSUED':
			return { label: 'Unpaid', tone: 'info' }
		case 'PARTIALLY_PAID':
			return { label: 'Part paid', tone: 'warning' }
		case 'PAID':
			return { label: 'Paid', tone: 'success' }
		case 'VOID':
			return { label: 'Void', tone: 'neutral' }
		default:
			return { label: 'Unpaid', tone: 'info' }
	}
}

/**
 * The tone pairs from app.css, as classes.
 *
 * app.css says every state resolves to one of five tones and to use
 * `text-success bg-success-bg` rather than hard-coding a colour. `info` is the
 * blue one — it is what "Billed" and "Unpaid" mean: out with the tenant, not
 * yet paid, and not yet late.
 */
export const TONE_CLASS: Record<DisplayTone, string> = {
	neutral: 'text-muted-foreground bg-muted border-transparent',
	info: 'text-info bg-info-bg border-transparent',
	warning: 'text-warning bg-warning-bg border-transparent',
	success: 'text-success bg-success-bg border-transparent',
	danger: 'text-danger bg-danger-bg border-transparent',
}
