/**
 * F1–F2 — changing the unit an application is for.
 *
 * `rentTermsChanged()` now includes DesiredUnitId, so moving an application to
 * another unit re-derives its rent charges — and that re-derivation is what
 * refuses the change once any rent charge is billed.
 *
 * f1 is the one with teeth. The Cube resolves an invoice's property through
 * `financial_accounts.property_id`:
 *
 *     COALESCE((SELECT fa.property_id FROM financial_accounts fa
 *               WHERE fa.id = invoices.financial_account_id ...), ...)
 *
 * and the security scope uses the same derivation. Move an application across
 * properties and its account keeps pointing at the old one, so its invoices
 * report under the wrong property and a manager restricted to the new property
 * cannot see them. That is data correctness, not presentation.
 */
import {
	REQUIRED_MODES,
	createBlock,
	createProperty,
	createUnit,
	getAccount,
	getApplicationAccountId,
	listProperties,
	setApplicationUnit,
	setPropertyModes,
} from '../lib/api'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState, tag } from '../lib/state'
import { expect, test } from '../lib/test'

const ALT_PROPERTY = 'E2E Suite Alt'

/**
 * A second property, so "the account followed the unit" is observable. Within a
 * single property the assertion would be vacuous — property_id would match
 * whether or not anything updated it.
 */
async function altPropertyUnit(s: ReturnType<typeof readRunState>) {
	const existing = await listProperties(s.token, s.clientId)
	let property = existing.find((p) => p.name === ALT_PROPERTY)

	if (!property) {
		property = await createProperty(s.token, s.clientId, ALT_PROPERTY)
	}
	if (!(property.modes ?? []).includes('LEASE')) {
		await setPropertyModes(s.token, s.clientId, property.id, REQUIRED_MODES)
	}

	const block = await createBlock(
		s.token,
		s.clientId,
		property.id,
		tag(s.runId, 'alt-block'),
	)
	const unit = await createUnit(s.token, s.clientId, property.id, block.id, {
		name: tag(s.runId, 'alt-unit'),
		rentFee: 75_000,
	})
	return { property, unit }
}

test('f1 · moving an application to another property moves its account', async () => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'f1', { seq: 160 })
	const { property: altProperty, unit: altUnit } = await altPropertyUnit(s)

	const accountId = await getApplicationAccountId(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)
	const before = await getAccount(s.token, s.clientId, s.propertyId, accountId)
	expect(before.account.property_id).toBe(s.propertyId)

	await setApplicationUnit(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
		altUnit.id,
	)

	// Read through the original property: if the account really moved, this is
	// also the call that should stop resolving — but today it still answers.
	const after = await getAccount(s.token, s.clientId, s.propertyId, accountId)
	expect(
		after.account.property_id,
		'the account should follow the unit to its new property',
	).toBe(altProperty.id)
})

test('f2 · a billed rent charge blocks changing the unit', async ({ page }) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'f2', { seq: 170 })
	const { unit: altUnit } = await altPropertyUnit(s)

	// Bill a rent charge — the state that must freeze the unit, since rent
	// charges were derived against the unit being replaced.
	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/financial`,
	)
	await page
		.getByRole('button', { name: /Rent .*Not yet billed/i })
		.first()
		.click()
	const record = page.getByRole('button', { name: /^Record payment$/i })
	await expect(record).toBeEnabled({ timeout: 20_000 })
	await record.click()
	await expect(
		page.getByText(/rent charges have already been billed/i),
	).toBeVisible({ timeout: 45_000 })

	await expect(
		setApplicationUnit(
			s.token,
			s.clientId,
			s.propertyId,
			application.id,
			altUnit.id,
		),
		'changing the unit under billed rent charges should be refused',
	).rejects.toThrow(/ChargesAlreadyBilled|UnitHasCharges/)
})
