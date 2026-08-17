/**
 * A3 — the collection plan previews each cadence, and the choice governs the
 * lease.
 *
 * Two things are worth guarding. First, each option states what it would do —
 * how many invoices, and for how much — and that arithmetic must follow from
 * the agreed rent and term rather than being decorative. Second, cadence lives
 * on the financial account, so a choice made before approval must still be in
 * force on the lease afterwards.
 *
 * The expected figures are derived from the factory's rent and term, so this
 * holds for any values it is given.
 */
import { approveApplication } from '../lib/api'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

const money = (value: number) =>
	value.toLocaleString('en-US', { minimumFractionDigits: 2 })

test('the collection plan previews each cadence and the choice reaches the lease', async ({
	page,
}) => {
	const s = readRunState()
	const { application, rentFee, stayDuration } =
		await makeApprovableApplication(s, 'a3', { seq: 90 })

	const rent = rentFee / 100
	const wholeTerm = rent * stayDuration
	const quarters = stayDuration / 3

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/financial`,
	)

	// The plan is edited in place from the running view now, so the options
	// are behind "Change how often".
	await page
		.getByRole('button', { name: /change how often/i })
		.click({ timeout: 20_000 })

	// ── each option previews its own schedule ──────────────────────────────
	await expect(
		page.getByRole('button', { name: /the whole term at once/i }),
	).toContainText(
		`1 bill · ${stayDuration} payments · GH₵ ${money(wholeTerm)}`,
		{
			timeout: 20_000,
		},
	)

	await expect(
		page.getByRole('button', { name: /every three months/i }),
	).toContainText(`${quarters} bills · first GH₵ ${money(rent * 3)}`)

	await expect(
		page.getByRole('button', { name: /^every month/i }),
	).toContainText(`${stayDuration} bills · first GH₵ ${money(rent)}`)

	// ── choosing one sticks to the account, through approval ───────────────
	await page.getByRole('button', { name: /every three months/i }).click()
	await page.waitForLoadState('networkidle')

	const lease = await approveApplication(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)

	await page.goto(`/properties/${s.propertyId}/occupancy/leases/${lease.id}`)
	await page.getByRole('tab', { name: 'Financials' }).click()

	await expect(page.getByText(/every 3 months/i).first()).toBeVisible({
		timeout: 20_000,
	})
})
