import dayjs from 'dayjs'
import type { SerializedEditorState } from 'lexical'

import { formatAmount, formatAmountWithoutCurrency } from '~/lib/format-amount'

/**
 * Build a map of template field names to their resolved values
 * from a TenantApplication (with populated relations).
 *
 * Fields whose source is null/undefined are omitted from the map,
 * so the token stays as `#FieldName` in the document.
 */
export function buildTemplateFieldMap(
	app: TenantApplication,
): Record<string, string> {
	const map: Record<string, string> = {}
	const signatures = app.lease_agreement_document_signatures ?? []

	const set = (key: string, value: unknown) => {
		if (value != null && value !== '') {
			map[key] = String(value)
		}
	}

	// Landlord (from created_by ClientUser)
	set('LandlordName', app.created_by?.name)
	set('LandlordEmail', app.created_by?.email)
	set('LandlordPhoneNumber', app.created_by?.phone_number)

	// Tenant
	const tenantName = [app.first_name, app.other_names, app.last_name]
		.filter(Boolean)
		.join(' ')
	set('TenantName', tenantName)
	set('TenantAddress', app.current_address)
	set('TenantEmail', app.email)
	set('TenantPhoneNumber', app.phone)
	set('TenantIDType', app.id_type)
	set('TenantIDNumber', app.id_number)
	if (app.date_of_birth) {
		set('TenantDateOfBirth', dayjs(app.date_of_birth).format('MMM D, YYYY'))
	}
	set('TenantNationality', app.nationality)
	set('TenantOccupation', app.occupation)
	set('TenantEmployer', app.employer)
	set('TenantEmergencyContactName', app.emergency_contact_name)
	set('TenantEmergencyContactPhone', app.emergency_contact_phone)

	// Property
	const property = app.desired_unit?.property
	set('PropertyName', property?.name)
	set('PropertyAddress', property?.address)
	set('PropertyCity', property?.city)
	set('PropertyRegion', property?.region)
	set('PropertyGPSAddress', property?.gps_address)

	// Unit
	set('UnitNumber', app.desired_unit?.name)
	set('UnitType', app.desired_unit?.type)

	// Application & Lease terms
	set('ApplicationCode', app.code)
	if (app.desired_move_in_date) {
		set('LeaseStartDate', dayjs(app.desired_move_in_date).format('MMM D, YYYY'))
	}
	if (app.stay_duration && app.stay_duration_frequency) {
		set(
			'LeaseDuration',
			`${app.stay_duration} ${app.stay_duration_frequency.toLowerCase()}`,
		)
	}
	if (
		app.desired_move_in_date &&
		app.stay_duration &&
		app.stay_duration_frequency
	) {
		const unit = frequencyToDayjsUnit(app.stay_duration_frequency)
		if (unit) {
			set(
				'LeaseEndDate',
				dayjs(app.desired_move_in_date)
					.add(app.stay_duration, unit)
					.format('MMM D, YYYY'),
			)
		}
	}
	if (app.rent_fee) {
		set('RentAmount', formatAmountWithoutCurrency(app.rent_fee))
		set('RentAmountInWords', numberToWords(app.rent_fee))
	}
	if (app.payment_frequency) {
		set('RentFrequency', app.payment_frequency.toLowerCase())
	}
	if (app.security_deposit_fee) {
		set('SecurityDeposit', formatAmount(app.security_deposit_fee))
	}
	if (app.initial_deposit_fee) {
		set('InitialDeposit', formatAmount(app.initial_deposit_fee))
	}

	// Signing timestamps (from document signatures)
	const pmSig = signatures.find((s) => s.role === 'PROPERTY_MANAGER')
	const tenantSig = signatures.find((s) => s.role === 'TENANT')
	const pmWitnessSig = signatures.find((s) => s.role === 'PM_WITNESS')
	const tenantWitnessSig = signatures.find((s) => s.role === 'TENANT_WITNESS')

	if (pmSig?.created_at) {
		set('LandlordSignedOn', dayjs(pmSig.created_at).format('MMM D, YYYY'))
	}
	if (tenantSig?.created_at) {
		set('TenantSignedOn', dayjs(tenantSig.created_at).format('MMM D, YYYY'))
	}
	if (pmWitnessSig?.signed_by_name) {
		set('LandlordWitnessName', pmWitnessSig.signed_by_name)
	}
	if (pmWitnessSig?.created_at) {
		set(
			'LandlordWitnessSignedOn',
			dayjs(pmWitnessSig.created_at).format('MMM D, YYYY'),
		)
	}
	if (tenantWitnessSig?.signed_by_name) {
		set('TenantWitnessName', tenantWitnessSig.signed_by_name)
	}
	if (tenantWitnessSig?.created_at) {
		set(
			'TenantWitnessSignedOn',
			dayjs(tenantWitnessSig.created_at).format('MMM D, YYYY'),
		)
	}

	return map
}

/**
 * Walk a serialized Lexical editor state and replace `hashtag` nodes
 * (text like `#FieldName`) with plain text nodes containing the resolved value.
 *
 * Unresolvable tokens (not in fieldMap) are left as-is.
 */
export function resolveTemplateFields(
	state: SerializedEditorState,
	fieldMap: Record<string, string>,
): SerializedEditorState {
	const cloned = JSON.parse(JSON.stringify(state)) as SerializedEditorState

	function walk(node: Record<string, unknown>) {
		if (node.type === 'hashtag' && typeof node.text === 'string') {
			const fieldName = node.text.replace(/^#/, '')
			if (fieldMap[fieldName]) {
				node.type = 'text'
				node.text = fieldMap[fieldName]
			}
		}
		if (Array.isArray(node.children)) {
			for (const child of node.children) {
				walk(child as Record<string, unknown>)
			}
		}
	}

	walk(cloned.root as unknown as Record<string, unknown>)
	return cloned
}

function frequencyToDayjsUnit(
	freq: string,
): 'day' | 'week' | 'month' | 'year' | null {
	switch (freq.toUpperCase()) {
		case 'DAILY':
			return 'day'
		case 'WEEKLY':
			return 'week'
		case 'MONTHLY':
			return 'month'
		case 'QUARTERLY':
			return 'month' // handled via multiplier in caller — but stay_duration already accounts for it
		case 'BIANNUALLY':
			return 'month'
		case 'ANNUALLY':
			return 'year'
		default:
			return null
	}
}

const ONES = [
	'',
	'one',
	'two',
	'three',
	'four',
	'five',
	'six',
	'seven',
	'eight',
	'nine',
	'ten',
	'eleven',
	'twelve',
	'thirteen',
	'fourteen',
	'fifteen',
	'sixteen',
	'seventeen',
	'eighteen',
	'nineteen',
]

const TENS = [
	'',
	'',
	'twenty',
	'thirty',
	'forty',
	'fifty',
	'sixty',
	'seventy',
	'eighty',
	'ninety',
]

function numberToWords(n: number): string {
	if (n === 0) return 'zero'

	const whole = Math.floor(n)
	const decimal = Math.round((n - whole) * 100)

	let result = intToWords(whole)
	if (decimal > 0) {
		result += ` and ${intToWords(decimal)} pesewas`
	}

	return result
}

function intToWords(n: number): string {
	if (n === 0) return ''
	if (n < 20) return ONES[n] ?? ''
	if (n < 100) {
		const remainder = n % 10
		return (
			(TENS[Math.floor(n / 10)] ?? '') +
			(remainder ? '-' + (ONES[remainder] ?? '') : '')
		)
	}
	if (n < 1000) {
		const remainder = n % 100
		return (
			(ONES[Math.floor(n / 100)] ?? '') +
			' hundred' +
			(remainder ? ' and ' + intToWords(remainder) : '')
		)
	}
	if (n < 1_000_000) {
		const remainder = n % 1000
		return (
			intToWords(Math.floor(n / 1000)) +
			' thousand' +
			(remainder
				? (remainder < 100 ? ' and ' : ' ') + intToWords(remainder)
				: '')
		)
	}
	if (n < 1_000_000_000) {
		const remainder = n % 1_000_000
		return (
			intToWords(Math.floor(n / 1_000_000)) +
			' million' +
			(remainder
				? (remainder < 100 ? ' and ' : ' ') + intToWords(remainder)
				: '')
		)
	}
	return String(n)
}
