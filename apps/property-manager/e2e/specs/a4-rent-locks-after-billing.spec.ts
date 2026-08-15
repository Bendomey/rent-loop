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
	await expect(page.getByText(/you state it here/i)).toBeVisible({
		timeout: 20_000,
	})

	// ── collect a first payment ────────────────────────────────────────────
	// Picking a charge is what gives the collect section a non-zero total;
	// without one, and without an account, its submit stays disabled.
	await page
		.getByRole('button', { name: /Rent .*Not yet billed/i })
		.first()
		.click()

	const details = page
		.locator('div')
		.filter({ hasText: /payment details/i })
		.last()
	await details.getByRole('combobox').first().click()
	await page.getByRole('option').first().click()

	const record = page.getByRole('button', { name: /^Record payment$/i })
	await expect(record).toBeEnabled({ timeout: 20_000 })
	await record.click()

	// ── rent is now fixed ──────────────────────────────────────────────────
	await expect(
		page.getByText(/rent charges have already been billed/i),
	).toBeVisible({ timeout: BILL_TIMEOUT })

	// And the invitation to state it is gone, not merely accompanied by a note.
	await expect(page.getByText(/you state it here/i)).toHaveCount(0)
})
