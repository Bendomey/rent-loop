/**
 * Placeholder data for the parts of General Settings that have no API yet.
 *
 * Branding (logo, document accent colour) and Regional preferences (currency,
 * time zone, date format, language) are not on the Client model and
 * PATCH /v1/admin/clients does not accept them. The UI is built to the design
 * so it is ready to wire up, but every control toasts via comingSoon()
 * (~/components/blocks/settings-ui) instead of pretending to save.
 *
 * Replace each of these with real client fields when the endpoints land.
 */

export const PLACEHOLDER_ACCENT_COLOUR = '#C8003A'

export const PLACEHOLDER_ACCENT_SWATCHES = [
	'#C8003A',
	'#111110',
	'#1B6E4A',
	'#2456C4',
	'#BD5E16',
]

export const PLACEHOLDER_PREFERENCES = {
	currency: 'GHS — Ghana Cedi',
	timezone: 'GMT (Africa/Accra)',
	dateFormat: 'DD MMM YYYY',
	language: 'English (UK)',
}
