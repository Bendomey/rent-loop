/**
 * The browser's IANA timezone, carried in a cookie so the *server* can read it.
 *
 * Login collects full device metadata in the browser and posts it with the
 * form, which works because a form submission originates client-side. Token
 * refresh does not: it happens inside server middleware, where
 * `Intl.DateTimeFormat()` resolves to the machine running the app — in
 * production, a Fly host. Reading the zone there would stamp every refreshed
 * session with the server's location instead of the person's.
 *
 * A cookie is the one channel that carries a browser-derived value into a
 * server-side request without a round trip. It holds only the zone: the rest
 * of the device description cannot change mid-session, and the backend leaves
 * those columns alone when a refresh omits them.
 */

export const SESSION_TIMEZONE_COOKIE = 'rl_tz'

/** A year. The zone rarely changes, and a stale cookie is corrected on the
 * next page load rather than causing a failure. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365

/**
 * Writes the current zone if it differs from what is already stored. Safe to
 * call on every render — it is a no-op once the value matches.
 *
 * Not HttpOnly by necessity: the browser is the only thing that knows this
 * value, so it has to be able to write it. Nothing security-relevant rests on
 * it — the backend records any client-reported place as CLIENT-sourced and the
 * UI presents it as reported, not verified.
 */
export function rememberBrowserTimezone() {
	if (typeof document === 'undefined') return

	try {
		const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
		if (!zone) return
		if (readCookie(SESSION_TIMEZONE_COOKIE) === zone) return

		document.cookie = [
			`${SESSION_TIMEZONE_COOKIE}=${encodeURIComponent(zone)}`,
			'path=/',
			`max-age=${MAX_AGE_SECONDS}`,
			'SameSite=Lax',
		].join('; ')
	} catch {
		// A missing Intl or a blocked cookie simply means no location; never
		// let this throw into a render.
	}
}

function readCookie(name: string): string | undefined {
	const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
	return match?.[1] ? decodeURIComponent(match[1]) : undefined
}

/**
 * Server-side counterpart: pulls the zone out of a request's Cookie header.
 * Returns undefined when absent or empty so callers can omit metadata rather
 * than send a hollow object.
 */
export function timezoneFromRequest(request: Request): string | undefined {
	const header = request.headers.get('Cookie')
	if (!header) return undefined

	const match = header.match(
		new RegExp(`(?:^|;\\s*)${SESSION_TIMEZONE_COOKIE}=([^;]*)`),
	)
	if (!match?.[1]) return undefined

	try {
		const zone = decodeURIComponent(match[1]).trim()
		return zone.length ? zone : undefined
	} catch {
		return undefined
	}
}
