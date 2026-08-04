import dayjs from 'dayjs'
import type { SerializedEditorState } from 'lexical'

import { formatAmount, formatAmountWithoutCurrency } from '~/lib/format-amount'

export type DocumentTemplateFieldMap = {
	// Landlord
	LandlordName?: string
	LandlordEmail?: string
	LandlordPhoneNumber?: string
	// Tenant
	TenantName?: string
	TenantAddress?: string
	TenantEmail?: string
	TenantPhoneNumber?: string
	TenantIDType?: string
	TenantIDNumber?: string
	TenantDateOfBirth?: string
	TenantNationality?: string
	TenantOccupation?: string
	TenantEmployer?: string
	TenantEmergencyContactName?: string
	TenantEmergencyContactPhone?: string
	// Property
	PropertyName?: string
	PropertyAddress?: string
	PropertyCity?: string
	PropertyRegion?: string
	PropertyGPSAddress?: string
	// Unit
	UnitNumber?: string
	UnitType?: string
	// Lease terms
	ApplicationCode?: string
	LeaseStartDate?: string
	LeaseDuration?: string
	LeaseEndDate?: string
	RentAmount?: string
	RentAmountInWords?: string
	RentFrequency?: string
	SecurityDeposit?: string
	InitialDeposit?: string
	// Signing timestamps
	LandlordSignedOn?: string
	TenantSignedOn?: string
	LandlordWitnessName?: string
	LandlordWitnessSignedOn?: string
	TenantWitnessName?: string
	TenantWitnessSignedOn?: string
}

export function buildLeaseFieldMap(
	lease: Lease,
	signatures: RentloopDocumentSignature[] = [],
): DocumentTemplateFieldMap {
	const map: Record<string, string> = {}

	const set = (key: string, value: unknown) => {
		if (value != null && value !== '') {
			map[key] = String(value)
		}
	}

	// Landlord — from the application's created_by
	const createdBy = lease.tenant_application?.created_by
	set('LandlordName', createdBy?.user?.name)
	set('LandlordEmail', createdBy?.user?.email)
	set('LandlordPhoneNumber', createdBy?.user?.phone_number)

	// Tenant
	const tenant = lease.tenant
	if (tenant) {
		const tenantName = [tenant.first_name, tenant.last_name]
			.filter(Boolean)
			.join(' ')
		set('TenantName', tenantName)
		set('TenantAddress', tenant.current_address)
		set('TenantEmail', tenant.email)
		set('TenantPhoneNumber', tenant.phone)
		set('TenantIDType', tenant.id_type)
		set('TenantIDNumber', tenant.id_number)
		if (tenant.date_of_birth) {
			set(
				'TenantDateOfBirth',
				dayjs(tenant.date_of_birth).format('MMM D, YYYY'),
			)
		}
		set('TenantNationality', tenant.nationality)
		set('TenantOccupation', tenant.occupation)
		set('TenantEmployer', tenant.employer)
		set('TenantEmergencyContactName', tenant.emergency_contact_name)
		set('TenantEmergencyContactPhone', tenant.emergency_contact_phone)
	}

	// Property
	const property = lease.unit?.property
	set('PropertyName', property?.name)
	set('PropertyAddress', property?.address)
	set('PropertyCity', property?.city)
	set('PropertyRegion', property?.region)
	set('PropertyGPSAddress', property?.gps_address)

	// Unit
	set('UnitNumber', lease.unit?.name)
	set('UnitType', lease.unit?.type)

	// Lease terms
	set('ApplicationCode', lease.tenant_application?.code)
	if (lease.move_in_date) {
		set('LeaseStartDate', dayjs(lease.move_in_date).format('MMM D, YYYY'))
	}
	if (lease.stay_duration && lease.stay_duration_frequency) {
		set(
			'LeaseDuration',
			`${lease.stay_duration} ${lease.stay_duration_frequency.toLowerCase()}`,
		)
		const unit = frequencyToDayjsUnit(lease.stay_duration_frequency)
		if (unit && lease.move_in_date) {
			set(
				'LeaseEndDate',
				dayjs(lease.move_in_date)
					.add(lease.stay_duration, unit)
					.format('MMM D, YYYY'),
			)
		}
	}
	if (lease.rent_fee) {
		set('RentAmount', formatAmountWithoutCurrency(lease.rent_fee))
		set('RentAmountInWords', numberToWords(lease.rent_fee))
	}
	if (lease.payment_frequency) {
		set('RentFrequency', lease.payment_frequency.toLowerCase())
	}

	// Signing timestamps
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

export function buildTenantApplicationFieldMap(
	app: TenantApplication,
): DocumentTemplateFieldMap {
	const map: Record<string, string> = {}
	const signatures = app.lease_agreement_document_signatures ?? []

	const set = (key: string, value: unknown) => {
		if (value != null && value !== '') {
			map[key] = String(value)
		}
	}

	// Landlord (from created_by ClientUser)
	set('LandlordName', app.created_by?.user?.name)
	set('LandlordEmail', app.created_by?.user?.email)
	set('LandlordPhoneNumber', app.created_by?.user?.phone_number)

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
		set(
			'SecurityDeposit',
			formatAmount(app.security_deposit_fee, app.rent_fee_currency),
		)
	}
	if (app.initial_deposit_fee) {
		set(
			'InitialDeposit',
			formatAmount(app.initial_deposit_fee, app.rent_fee_currency),
		)
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
	fieldMap: DocumentTemplateFieldMap,
): SerializedEditorState {
	const cloned = JSON.parse(JSON.stringify(state)) as SerializedEditorState

	const fieldMapRecord = fieldMap as Record<string, string | undefined>

	function walk(node: Record<string, unknown>) {
		if (node.type === 'hashtag' && typeof node.text === 'string') {
			const fieldName = node.text.replace(/^#/, '')
			if (fieldMapRecord[fieldName]) {
				node.type = 'text'
				node.text = fieldMapRecord[fieldName]
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
