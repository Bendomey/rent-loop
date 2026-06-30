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

export function maskPhone(phone?: string | null): string {
	if (!phone) return 'your phone'

	const visible = phone.slice(-4)
	const prefixLength = Math.min(phone.length - 4, 4) // keep up to 4 leading chars (e.g. +233)
	const prefix = phone.slice(0, prefixLength)
	const maskedLength = phone.length - prefix.length - visible.length
	const masked = '•'.repeat(Math.max(maskedLength, 0))

	return `${prefix}${masked}${visible}`
}
