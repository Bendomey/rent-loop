/**
 * G6 — adding a fee and taking the money for it are one errand.
 *
 * A landlord handed cash for a repair used to have to add the charge, bill it,
 * find the bill, and then record against it — four steps for one event. The
 * fee dialog now asks whether the money is already in hand, and answering yes
 * bills it and settles it in one pass.
 *
 * The fee is saved before the question appears, so declining must still leave
 * it on the account. That is the half worth pinning: a flow that loses the fee
 * when you say "not yet" is worse than no question at all.
 */
import {
	approveApplication,
	composeInvoice,
	getAccount,
	getApplicationAccountId,
} from '../lib/api'
import { makeApprovableApplication } from '../lib/factory'
import { addFee, declinePaidAlready } from '../lib/money'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

const FEE = 275.5
const BILL_TIMEOUT = 45_000

/** Opens the fee dialog and saves a fee, leaving the follow-up question up. */
async function saveFee(page: import('@playwright/test').Page, name: string) {
	await page.getByRole('button', { name: 'Add a fee' }).first().click()
	const dialog = page.getByRole('dialog', { name: 'Add a fee' })
	await expect(dialog).toBeVisible({ timeout: 20_000 })

	// Nothing is preselected — the submit stays dead until a type is picked,
	// which is the guard against a repair being filed as a deposit by default.
	await expect(dialog.locator('#save-fee')).toBeDisabled()

	await dialog.getByRole('button', { name: 'Something else' }).click()
	await dialog.locator('#fee-name').fill(name)
	await dialog.locator('#fee-amount').fill(String(FEE))
	await dialog.locator('#save-fee').click()
	await expect(dialog).toBeHidden({ timeout: 20_000 })
}

async function openMoney(page: import('@playwright/test').Page, url: string) {
	await page.goto(url)
	await page.getByRole('tab', { name: 'Money' }).click()
	await expect(
		page.getByRole('button', { name: 'Add a fee' }).first(),
	).toBeVisible({ timeout: 20_000 })
}

test('declining the question still leaves the fee on the account', async ({
	page,
}) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'g6', { seq: 700 })
	const lease = await approveApplication(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)

	await openMoney(
		page,
		`/properties/${s.propertyId}/occupancy/leases/${lease.id}`,
	)

	const feeName = `E2E Repair ${s.runId}`
	await saveFee(page, feeName)

	// The question is asked, and it is about this fee.
	const ask = page.getByRole('dialog', { name: 'Fee added' })
	await expect(ask).toBeVisible({ timeout: 20_000 })
	await expect(ask).toContainText(feeName)

	await declinePaidAlready(page)

	// Declining bills nothing, so the fee waits in the unbilled section — the
	// point being that it is still there at all.
	await expect(page.locator('#still-to-come').getByText(feeName)).toBeVisible({
		timeout: 20_000,
	})
})

test('saying they have paid bills the fee and settles it in one pass', async ({
	page,
}) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'g6b', {
		seq: 710,
	})
	const lease = await approveApplication(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)

	await openMoney(
		page,
		`/properties/${s.propertyId}/occupancy/leases/${lease.id}`,
	)

	const feeName = `E2E Callout ${s.runId}`
	await saveFee(page, feeName)

	const ask = page.getByRole('dialog', { name: 'Fee added' })
	await expect(ask).toBeVisible({ timeout: 20_000 })

	// A choice then a confirm, not a button that fires on touch: the answer
	// bills money, so the confirm only becomes the collecting one once "yes"
	// is actually selected.
	await expect(ask.locator('#fee-paid-confirm')).toHaveText(/done/i)
	await ask.getByRole('button', { name: /has handed over the money/i }).click()
	await expect(ask.locator('#fee-paid-confirm')).toHaveText(/take their/i)
	await ask.locator('#fee-paid-confirm').click()

	// The payment step is pre-armed with the whole fee — the landlord types
	// nothing in the common case.
	const collect = page.getByRole('dialog', { name: /pay for\?$/i })
	await expect(collect).toBeVisible({ timeout: BILL_TIMEOUT })
	await expect(collect).toContainText(feeName)
	await expect(collect.locator('#collect-amount')).toHaveValue(String(FEE))
	// Arriving from "yes, they've paid", the fee is already ticked — the
	// landlord is not asked to confirm the thing they just confirmed.
	await expect(collect.getByRole('checkbox').first()).toBeChecked()

	await collect.getByRole('combobox').first().click()
	await page.getByRole('option').first().click()
	await collect.locator('#save-collect').click()
	await expect(collect).toBeHidden({ timeout: BILL_TIMEOUT })

	// Billed and settled in one pass: the fee is neither waiting to be billed
	// nor waiting to be paid.
	await expect(page.locator('#still-to-come').getByText(feeName)).toHaveCount(
		0,
		{ timeout: 20_000 },
	)
	await expect(page.locator('#waiting-on-them').getByText(feeName)).toHaveCount(
		0,
	)
})

test('“they paid me” still works when nothing has been billed', async ({
	page,
}) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'g6c', {
		seq: 720,
	})
	const lease = await approveApplication(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)

	await openMoney(
		page,
		`/properties/${s.propertyId}/occupancy/leases/${lease.id}`,
	)

	// A fresh tenancy on a manual plan has charges but no bills, which is the
	// state the button used to die in: it targeted the oldest unpaid bill, so
	// with no bills at all it opened nothing and the landlord could not record
	// money the tenant had actually handed over.
	await expect(page.locator('#waiting-on-them')).toHaveCount(0)

	await page.getByRole('button', { name: /paid me$/i }).click()

	// It works off the charges themselves rather than a bill. Nothing is
	// ticked on opening, so there is nothing to save yet.
	const collect = page.getByRole('dialog', { name: /pay for\?$/i })
	await expect(collect).toBeVisible({ timeout: 20_000 })
	await expect(collect.locator('#save-collect')).toBeDisabled()

	// Typing what came in fills from the oldest, so the landlord does not have
	// to work out which months a lump sum covers.
	await collect.locator('#collect-amount').fill('1200')
	await expect(collect.getByRole('checkbox').first()).toBeChecked()
	await expect(collect).toContainText(/Recording/i)
	await expect(collect.locator('#save-collect')).toBeEnabled()

	// And ticking works the other way round — the amount follows the boxes.
	await collect.locator('#collect-amount').fill('')
	await expect(collect.locator('#save-collect')).toBeDisabled()
	await collect.getByRole('checkbox').first().click()
	await expect(collect.locator('#collect-amount')).not.toHaveValue('')
	await expect(collect.locator('#save-collect')).toBeEnabled()
})

test('“they paid me” is gone once everything is on a bill', async ({
	page,
}) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'g6d', {
		seq: 730,
	})
	const lease = await approveApplication(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)

	const accountId = await getApplicationAccountId(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)
	const { charges } = await getAccount(
		s.token,
		s.clientId,
		s.propertyId,
		accountId,
	)

	// Bill the lot, so there is nothing left for a payment to be put against.
	await composeInvoice(
		s.token,
		s.clientId,
		s.propertyId,
		accountId,
		charges.map((charge) => ({
			charge_instance_id: charge.id,
			amount: charge.amount,
		})),
	)

	await openMoney(
		page,
		`/properties/${s.propertyId}/occupancy/leases/${lease.id}`,
	)

	// The button collects against unbilled charges, so with none left it would
	// open an empty dialog. It is hidden rather than shown and dead.
	await expect(page.getByRole('button', { name: /paid me$/i })).toHaveCount(0)

	// And money is still recordable — from the bill that went out.
	await expect(
		page.getByRole('button', { name: 'Record a payment' }).first(),
	).toBeVisible({ timeout: 20_000 })
})
