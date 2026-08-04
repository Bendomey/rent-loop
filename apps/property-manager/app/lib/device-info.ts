import pkg from '../../package.json'

/**
 * Self-description of the device starting a session, stored against the
 * refresh token so a future "active sessions" view can say *which* device.
 *
 * Every field is optional and every one is omitted rather than guessed. An
 * absent key means "this client could not determine it" — never "unknown" as a
 * value, and never an inference dressed up as a fact. A sessions UI confidently
 * showing wrong hardware is worse than one showing nothing.
 *
 * Notably absent on web: `device.manufacturer` / `device.model`. No browser API
 * exposes them on desktop — `getHighEntropyValues(['model'])` returns an empty
 * string outside Android — so this client never sends them. A native mobile
 * client, where the OS does expose them, can.
 */
export interface SessionDeviceMetadata {
	platform: 'web'
	device_type?: 'desktop' | 'mobile' | 'tablet'
	browser?: { name?: string; version?: string }
	os?: { name?: string; version?: string }
	app?: { name: string; version: string }
	locale?: { language?: string; timezone?: string }
}

/** Chromium-only client hints; absent in Firefox and Safari. */
interface UADataBrand {
	brand: string
	version: string
}
interface NavigatorUAData {
	brands?: UADataBrand[]
	mobile?: boolean
	platform?: string
	getHighEntropyValues?: (hints: string[]) => Promise<{
		platformVersion?: string
		uaFullVersion?: string
	}>
}

const APP_DISPLAY_NAME = 'Rentloop Property Manager'

/**
 * Picks the real browser out of the brands list. Chromium ships deliberate
 * decoys ("Not)A;Brand", "Chromium") alongside the actual product, so the last
 * non-decoy entry is the one worth recording.
 */
function browserFromBrands(brands?: UADataBrand[]) {
	if (!brands?.length) return undefined
	const real = brands.filter(
		(b) => !/not.*a.*brand/i.test(b.brand) && b.brand !== 'Chromium',
	)
	const chosen = real[real.length - 1] ?? brands[brands.length - 1]
	return chosen ? { name: chosen.brand, version: chosen.version } : undefined
}

/** Last-resort parse for engines without client hints. */
function browserFromUserAgent(ua: string) {
	const patterns: Array<[string, RegExp]> = [
		['Edge', /Edg\/([\d.]+)/],
		['Opera', /OPR\/([\d.]+)/],
		['Firefox', /Firefox\/([\d.]+)/],
		['Chrome', /Chrome\/([\d.]+)/],
		['Safari', /Version\/([\d.]+).*Safari/],
	]
	for (const [name, re] of patterns) {
		const m = ua.match(re)
		if (m) return { name, version: m[1]?.split('.')[0] }
	}
	return undefined
}

function osFromUserAgent(ua: string) {
	if (/Windows NT/.test(ua)) return { name: 'Windows' }
	if (/Mac OS X/.test(ua)) return { name: 'macOS' }
	if (/Android/.test(ua)) return { name: 'Android' }
	if (/iPhone|iPad|iPod/.test(ua)) return { name: 'iOS' }
	if (/Linux/.test(ua)) return { name: 'Linux' }
	return undefined
}

function deviceType(ua: string, mobile?: boolean) {
	if (/iPad|Tablet/i.test(ua)) return 'tablet' as const
	if (mobile) return 'mobile' as const
	if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile' as const
	return 'desktop' as const
}

function prune<T extends object>(obj: T): T | undefined {
	const entries = Object.entries(obj).filter(
		([, v]) => v !== undefined && v !== null && v !== '',
	)
	return entries.length ? (Object.fromEntries(entries) as T) : undefined
}

/**
 * Collects what this browser can honestly report. Never throws: metadata is
 * cosmetic, and a failure here must not be able to block a login.
 */
export async function collectDeviceMetadata(): Promise<SessionDeviceMetadata> {
	const base: SessionDeviceMetadata = {
		platform: 'web',
		app: { name: APP_DISPLAY_NAME, version: pkg.version },
	}

	if (typeof navigator === 'undefined') return base

	try {
		const ua = navigator.userAgent ?? ''
		const uaData = (
			navigator as Navigator & { userAgentData?: NavigatorUAData }
		).userAgentData

		let osVersion: string | undefined
		if (uaData?.getHighEntropyValues) {
			try {
				// platformVersion is coarse by design — Chrome reports macOS as
				// "15.0.0" regardless of the actual point release.
				const high = await uaData.getHighEntropyValues(['platformVersion'])
				osVersion = high.platformVersion || undefined
			} catch {
				// client hints unavailable; fall through with what we have
			}
		}

		const browser = uaData?.brands
			? browserFromBrands(uaData.brands)
			: browserFromUserAgent(ua)

		const osName = uaData?.platform || osFromUserAgent(ua)?.name

		return {
			...base,
			device_type: deviceType(ua, uaData?.mobile),
			browser: browser ? prune(browser) : undefined,
			os: prune({ name: osName, version: osVersion }),
			locale: prune({
				language: navigator.language,
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			}),
		}
	} catch {
		return base
	}
}
