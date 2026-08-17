/**
 * A4 — agreed rent locks once charges have been billed.
 *
 * Changing rent rebuilds every rent charge, which the backend refuses once
 * anything has been invoiced (RederiveRent's ChargesAlreadyBilled). The page
 * has to stop offering the edit rather than let a landlord try and be rejected
 * — so after collecting a first payment, the Agreed rent step must present
 * itself as fixed.
 *
 * The guard matters because the alternative is silent: rent that appears
 * editable but cannot be saved, on the one screen where the figure the lease is
 * written against is decided.
 */
import { ensurePaymentAccount } from '../lib/api'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

const BILL_TIMEOUT = 45_000

test('agreed rent locks once a payment has been collected', async ({
	page,
}) => {
	const s = readRunState()
	await ensurePaymentAccount(s.token, s.clientId)

	const { application } = await makeApprovableApplication(s, 'a4', { seq: 100 })

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/financial`,
	)

	// Rent is editable to begin with — otherwise the assertion at the end
	// proves nothing about collecting a payment having changed anything.
	await expect(page.getByText(/you can still change it/i)).toBeVisible({
		timeout: 20_000,
	})

	// ── collect a first payment ────────────────────────────────────────────
	// Payments are recorded in a dialog now. Ticking a rent charge is what
	// gives it a non-zero total; without one its submit stays disabled.
	await page.getByRole('button', { name: /paid me/i }).click()

	const dialog = page.getByRole('dialog', { name: /what did .* pay for/i })
	await expect(dialog).toBeVisible({ timeout: 20_000 })
	await dialog.getByRole('button', { name: /^Rent/ }).first().click()

	// "Where did it go?" — the payment account.
	await dialog.getByRole('combobox').last().click()
	await page.getByRole('option').first().click()

	const record = dialog.locator('#save-payment')
	await expect(record).toBeEnabled({ timeout: 20_000 })
	await record.click()

	// ── rent is now fixed ──────────────────────────────────────────────────
	await expect(page.getByText(/rent is fixed now/i)).toBeVisible({
		timeout: BILL_TIMEOUT,
	})

	// And the invitation to change it is gone, not merely accompanied by a note.
	await expect(page.getByText(/you can still change it/i)).toHaveCount(0)
})
