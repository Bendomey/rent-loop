/**
 * Placeholder data for the parts of My Account that have no API yet:
 * sessions, the email-verified badge and the password last-changed date.
 * Replace each of these with real data when the corresponding endpoints
 * land — nothing here is wired to the backend.
 *
 * Three actions are built but not released yet — two-factor auth, email
 * updates and account deletion. Their controls stay visible and toast via
 * comingSoon() (components/account-ui.tsx) instead of opening anything.
 * The dialogs are parked, not deleted, ready to re-wire when each lands:
 *   - components/enable-two-factor.tsx (uses the setup key below)
 *   - components/delete-account.tsx
 *   - update-email/ — the full 3-step OTP flow, previously live
 */

export type SessionKind = 'laptop' | 'phone' | 'tablet'

export interface AccountSession {
	id: string
	device: string
	os: string
	where: string
	ip: string
	last: string
	kind: SessionKind
	current?: boolean
}

export const PLACEHOLDER_SESSIONS: AccountSession[] = [
	{
		id: 's1',
		device: 'MacBook Pro · Chrome',
		os: 'macOS 15.3',
		where: 'Accra, Ghana',
		ip: '154.160.22.14',
		last: 'Active now',
		kind: 'laptop',
		current: true,
	},
	{
		id: 's2',
		device: 'iPhone 16 Pro Max · Rentloop app',
		os: 'iOS 19.1',
		where: 'Accra, Ghana',
		ip: '41.66.208.7',
		last: '2 hours ago',
		kind: 'phone',
	},
	{
		id: 's3',
		device: 'iPad Air · Safari',
		os: 'iPadOS 19',
		where: 'Tema, Ghana',
		ip: '41.66.190.55',
		last: 'Yesterday, 18:22',
		kind: 'tablet',
	},
	{
		id: 's4',
		device: 'Windows PC · Edge',
		os: 'Windows 11',
		where: 'Kumasi, Ghana',
		ip: '102.176.14.90',
		last: '12 Jul 2026',
		kind: 'laptop',
	},
]

export const PLACEHOLDER_EMAIL_VERIFIED = true
export const PLACEHOLDER_PASSWORD_CHANGED = '4 Mar 2026'
export const PLACEHOLDER_TWO_FACTOR_KEY = 'K7QP 4M2X 9LFA 3BRD'
