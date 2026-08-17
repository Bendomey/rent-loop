/**
 * Reading money and charge counts out of the financial screens.
 *
 * These parse rendered text rather than call the API on purpose: the point of
 * this suite is that the *screens* show the right figures, so a case that
 * checked the API would pass while the UI displayed nothing.
 */

/**
 * Reads a labelled money figure, e.g. "CHARGED\nGH₵ 6,000.00" -> 6000.
 *
 * By label rather than position: several bare "GH₵" strings appear as field
 * prefixes (the rent input has one), so the first currency symbol on a page is
 * usually not an amount.
 */
export function amountFor(pageText: string, label: string): number {
	const match = pageText.match(
		new RegExp(`${label}\\s*GH₵\\s*([\\d,]+\\.\\d{2})`, 'i'),
	)
	const captured = match?.[1]
	if (!captured) {
		throw new Error(`no "${label}" amount found on the page`)
	}
	return Number(captured.replace(/,/g, ''))
}

export interface ChargesSummary {
	count: number
	total: number
}

/**
 * Reads the charges panel header, e.g.
 * "14 charges · GH₵ 2,600.00 over the term" -> { count: 14, total: 2600 }.
 *
 * Both phrasings are accepted on purpose. The lease financials page still
 * speaks the ledger's vocabulary ("charges"); the redesigned application step
 * says "payments", because a landlord does not have charges. One helper, two
 * surfaces — so the cases that read it need no change.
 */
export function chargesSummary(pageText: string): ChargesSummary {
	const match = pageText.match(
		/(\d+)\s+(?:charges?|payments?)\s*·\s*GH₵\s*([\d,]+\.\d{2})/i,
	)
	const count = match?.[1]
	const total = match?.[2]
	if (!count || !total) {
		throw new Error('no charges summary found on the page')
	}
	return { count: Number(count), total: Number(total.replace(/,/g, '')) }
}
