/**
 * B2 — the financial account survives approval intact.
 *
 * The central claim of the v2 model: the account is created against the
 * application and *gains* a lease at approval. No record moves, nothing is
 * copied. So the figures a PM sees on the application's financial setup page
 * must be the same figures on the lease's financials tab afterwards.
 *
 * Both numbers are read from the UI rather than pinned, so this holds for any
 * rent or term the factory is given.
 */
import { expect, test } from '../lib/test'
import { approveApplication } from '../lib/api'
import { amountFor } from '../lib/expect'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'

test('the financial account carries from application to lease', async ({
	page,
}) => {
	const s = readRunState()
	const { unit, application, rentFee, stayDuration } =
		await makeApprovableApplication(s, 'b2', { seq: 20 })

	// ── what the application stage shows ───────────────────────────────────
	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/financial`,
	)

	await expect(page.getByText(/over the whole term/i).first()).toBeVisible({
		timeout: 20_000,
	})
	const applicationText = await page.locator('body').innerText()
	const chargedBefore = amountFor(applicationText, 'Over the whole term')

	// The charges derive from the terms, so this is the arithmetic the account
	// is claiming — assert it rather than trusting whatever the page renders.
	expect(chargedBefore).toBe((rentFee / 100) * stayDuration)

	// ── approve ────────────────────────────────────────────────────────────
	const lease = await approveApplication(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)

	// ── the lease shows the same account ───────────────────────────────────
	await page.goto(`/properties/${s.propertyId}/occupancy/leases/${lease.id}`)
	await page.getByRole('tab', { name: 'Financials' }).click()

	await expect(page.getByText(/outstanding/i).first()).toBeVisible({
		timeout: 20_000,
	})

	const leaseText = await page.locator('body').innerText()

	// Nothing was paid, so the account arrives with its full balance intact —
	// carried over rather than rebuilt empty.
	expect(amountFor(leaseText, 'OUTSTANDING')).toBe(chargedBefore)
	expect(amountFor(leaseText, 'COLLECTED TO DATE')).toBe(0)

	// And the lease is genuinely the one for our unit.
	await expect(page.getByText(unit.name).first()).toBeVisible()
})
