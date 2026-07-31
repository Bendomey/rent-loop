/**
 * Placeholder data for the parts of My Account that have no API yet:
 * the email-verified badge and the password last-changed date. Sessions are
 * live — see app/api/sessions.
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

export const PLACEHOLDER_EMAIL_VERIFIED = true
export const PLACEHOLDER_PASSWORD_CHANGED = '4 Mar 2026'
export const PLACEHOLDER_TWO_FACTOR_KEY = 'K7QP 4M2X 9LFA 3BRD'
