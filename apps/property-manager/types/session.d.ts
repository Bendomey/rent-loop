/**
 * One signed-in device on Settings › My Account › Sessions.
 *
 * Most fields are optional because the backend returns them only when it
 * genuinely knows: `location_*` depend on the client having reported a place,
 * and the device fields on either client metadata or a parseable User-Agent.
 * An absent field means "not known" and should render as nothing, never as a
 * placeholder — a sessions list confidently showing the wrong device is worse
 * than one showing less.
 */
interface Session {
	id: string
	/** True for the session making the request — the backend matches it against
	 * the session id carried in the access token. */
	is_current: boolean
	device_name?: string
	device_kind?: 'LAPTOP' | 'DESKTOP' | 'PHONE' | 'TABLET' | 'UNKNOWN'
	os?: string
	os_version?: string
	client_name?: string
	client_version?: string
	ip_address?: string
	timezone?: string
	location_city?: string
	location_country?: string
	/**
	 * CLIENT means the device reported this place, which makes it spoofable —
	 * present it as reported, not verified. SERVER would mean it was derived
	 * from the IP the backend observed; nothing sets that yet.
	 */
	location_source?: 'CLIENT' | 'SERVER'
	/** The true sign-in moment — stable for the life of the session. */
	signed_in_at: string
	/** Advances on each token refresh, so its resolution is the access token
	 * lifetime rather than per-request. */
	last_used_at: string
	expires_at: string
}
