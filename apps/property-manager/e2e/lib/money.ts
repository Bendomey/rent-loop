/**
 * Driving the lease Money page.
 *
 * Adding a fee there is a two-dialog errand: the fee is saved, then the page
 * asks whether the money is already in hand, because adding a fee and taking
 * payment for it are usually the same trip. Cases that only want the fee on
 * the account have to answer that question, or the modal sits over everything
 * they assert next.
 */
import { expect, type Page } from '@playwright/test'
import { composeInvoice, createCharge, type ChargeRow } from './api'
import { type RunState } from './state'

/**
 * Answers "Have they paid it already?" with no.
 *
 * Declining is deliberately the safe answer: the fee is saved before the
 * question appears, so this leaves the account exactly as an add-without-bill
 * used to.
 *
 * Tolerant of the question being absent so callers need not care whether the
 * page they are on asks it — the application's fee dialog does not.
 */
export async function declinePaidAlready(page: Page): Promise<void> {
	const ask = page.getByRole('dialog', { name: 'Fee added' })
	if (!(await ask.isVisible().catch(() => false))) return

	await ask.getByRole('button', { name: /not now/i }).click()
	// Waited on rather than assumed: Radix marks the rest of the page
	// aria-hidden while a dialog is open, so any getByRole the caller runs next
	// would miss its target until the modal has actually gone.
	await expect(ask).toBeHidden({ timeout: 10_000 })
}

/**
 * Adds a fee through the lease page and leaves it unbilled.
 *
 * Nothing is preselected in the dialog on purpose — the old one defaulted to
 * "Security deposit" and pre-filled the name to match — so the type has to be
 * chosen explicitly. "Something else" keeps a case about the fee it claims to
 * add rather than a refundable deposit.
 *
 * There is no bill-now branch any more: whether the money is already in hand
 * is asked afterwards, and answering no is what leaves the fee unbilled.
 */
export async function addFee(
	page: Page,
	name: string,
	amount: number,
): Promise<void> {
	await page.getByRole('button', { name: 'Add a fee' }).first().click()

	const dialog = page.getByRole('dialog', { name: 'Add a fee' })
	await expect(dialog).toBeVisible({ timeout: 20_000 })
	await dialog.getByRole('button', { name: 'Something else' }).click()
	await dialog.locator('#fee-name').fill(name)
	await dialog.locator('#fee-amount').fill(String(amount))
	await dialog.locator('#save-fee').click()
	await expect(dialog).toBeHidden({ timeout: 20_000 })

	await declinePaidAlready(page)
}

/**
 * A fee that is billed but unpaid, set up through the API.
 *
 * The lease page no longer offers billing without payment: the fee dialog lost
 * its "bill now" tick, because whether the money is in hand is asked
 * afterwards and answering yes settles as well as bills. That leaves no UI
 * route to a billed-and-unpaid fee, so cases that need one as a *precondition*
 * build it here — the same reason c4 voids through the API.
 *
 * What the page does with that state is still asserted through the page.
 */
export async function billedFee(
	s: RunState,
	accountId: string,
	name: string,
	amountMinor: number,
) {
	const charge = await createCharge(
		s.token,
		s.clientId,
		s.propertyId,
		accountId,
		{ name, category: 'OTHER', amount: amountMinor },
	)
	const invoice = await composeInvoice(
		s.token,
		s.clientId,
		s.propertyId,
		accountId,
		[{ charge_instance_id: charge.id, amount: charge.amount }],
	)
	return { charge, invoice }
}
