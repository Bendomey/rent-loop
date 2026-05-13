import { parsePhoneNumberFromString } from 'libphonenumber-js'

export function normalizeInternationalPhoneNumber(value?: string) {
	if (!value) return undefined

	const sanitized = value.trim().replace(/\s+/g, '').replace(/^00/, '+')
	const phoneNumber = parsePhoneNumberFromString(sanitized)

	if (!phoneNumber || !phoneNumber.isValid()) {
		return undefined
	}

	return phoneNumber.format('E.164')
}

export function isValidInternationalPhoneNumber(value?: string) {
	return Boolean(normalizeInternationalPhoneNumber(value))
}
