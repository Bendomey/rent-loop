/**
 * Working out what a payment covers.
 *
 * A landlord handed a lump sum does not think in charges — they think "she
 * gave me two thousand". Asking them to tick the right boxes to add up to that
 * is arithmetic the page can do itself, oldest first, which is the order money
 * is applied in anyway.
 */

/** What a charge still needs claiming for. A charge can only be billed once. */
export const owedOn = (charge: ChargeInstance) =>
	charge.amount - charge.invoiced_amount

/**
 * The charges an amount covers, filling from the oldest.
 *
 * Returns ids in due-date order. The last one may be only partly covered — a
 * payment smaller than the oldest charge still claims it, because the money
 * has to land somewhere and a part-paid charge is a state the ledger holds.
 */
export function allocateOldestFirst(
	charges: ChargeInstance[],
	amountMinor: number,
): string[] {
	if (amountMinor <= 0) return []

	const oldest = [...charges].sort(
		(a, b) => Date.parse(a.due_date) - Date.parse(b.due_date),
	)

	const claimed: string[] = []
	let remaining = amountMinor

	for (const charge of oldest) {
		if (remaining <= 0) break
		claimed.push(charge.id)
		remaining -= owedOn(charge)
	}

	return claimed
}
