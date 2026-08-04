declare global {
	interface Window {
		ENV: {
			API_ADDRESS: string
			AUTH_TOKEN?: string
			GOOGLE_MAPS_API_KEY: string
			CUBEJS_API_URL: string
			GOOGLE_ANALYTICS_ID: string
			SELECTED_CLIENT_ID: string
		}
		Tawk_API: {
			toggle: () => void
			minimize: () => void
			maximize: () => void
			showWidget: () => void
			hideWidget: () => void
			onChatMinimized: () => void
		}
	}
}
/**
 * Fetch wrapper to treat 4xx - 5xx status codes as errors.
 * We should be able to access those error messages in our catch block!
 *
 * @returns {Promise} - Returns promise.
 */
export function transport(
	input: RequestInfo,
	init?: RequestInit,
): Promise<Response> {
	return new Promise(async (resolve, reject) => {
		try {
			const response = await fetch(input, init)
			if (!response.ok) {
				reject(response)
			}
			resolve(response)
		} catch (error: unknown) {
			reject(error)
		}
	})
}

/**
 * The access token obtained by the most recent in-page refresh.
 *
 * window.ENV.AUTH_TOKEN is baked into the HTML at page load and goes stale the
 * moment we rotate, so it cannot be the source of truth for the rest of this
 * page's life. This needs no persistence: the next document request re-reads
 * the cookie and ships a correct window.ENV again.
 */
let liveAccessToken: string | null = null

let refreshInFlight: Promise<string | null> | null = null

async function requestRefreshedToken(): Promise<string | null> {
	try {
		const response = await fetch('/auth/refresh', {
			method: 'POST',
			headers: { Accept: 'application/json' },
		})
		if (!response.ok) return null
		const body = (await response.json()) as { token?: string }
		return body?.token ?? null
	} catch {
		return null
	}
}

/**
 * Coordinates all concurrent refresh attempts onto ONE request.
 *
 * Every caller that arrives while a refresh is in flight awaits the same
 * promise. Letting them each call /auth/refresh would replay an already-rotated
 * token, which the backend correctly interprets as theft and answers by
 * revoking the whole session.
 */
function refreshAccessTokenOnce(): Promise<string | null> {
	refreshInFlight ??= requestRefreshedToken().finally(() => {
		refreshInFlight = null
	})
	return refreshInFlight
}

interface FetchClientConfig extends RequestInit {
	/**
	 * If not set, defaults to the api address {API_ADDRESS}.
	 */
	baseUrl?: string
	/**
	 * If not set, defaults to client cookie.
	 */
	authToken?: string
	/**
	 * Most of our requests will be made with a token.
	 * So to make sure we don't set this everytime(ux reasons), I'm rather
	 * checking for unauthorized requests.
	 *
	 * @example - If request is an unauthorized request, we don't append the Authorization header.
	 * fetchClient('path-here', {isUnAuthorized:true})
	 *
	 * @example If request needs authorization, we append the Authorization header here.
	 * fetchClient('path-here')
	 */
	isUnAuthorizedRequest?: boolean
}

interface HttpResponse<T> extends Response {
	parsedBody: T
}

/**
 * Fetch client returns actual data/error.
 *
 * @returns {Promise} - Returns promise.
 */
export function fetchClient<T>(
	path: string,
	config?: FetchClientConfig,
): Promise<HttpResponse<T>> {
	const baseUrl = config?.baseUrl ?? window.ENV.API_ADDRESS // Defaults to api address.

	const attempt = async (): Promise<HttpResponse<T>> => {
		const headers = new Headers({
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...config?.headers,
		})

		// liveAccessToken outranks window.ENV: after a refresh, ENV is stale.
		const userToken =
			config?.authToken ?? liveAccessToken ?? window.ENV.AUTH_TOKEN

		if (!config?.isUnAuthorizedRequest && userToken && userToken.length) {
			headers.append('Authorization', `Bearer ${userToken}`)
		}

		const response = await transport(`${baseUrl}${path}`, {
			...config,
			headers,
		})

		if (response.status === 204) {
			return { ...response, parsedBody: {} as T }
		}

		const contentType = response.headers.get('Content-Type')
		const parsedBody = contentType?.includes('json')
			? await response.json()
			: await response.text()

		return { ...response, parsedBody }
	}

	return new Promise(async (resolve, reject) => {
		try {
			resolve(await attempt())
		} catch (error: unknown) {
			// A 401 on an authorized request means the access token expired.
			// Refresh once, then replay the request exactly once. An explicitly
			// unauthorized request has no token to refresh, and a caller-supplied
			// authToken is not ours to rotate.
			const shouldRefresh =
				error instanceof Response &&
				error.status === 401 &&
				!config?.isUnAuthorizedRequest &&
				!config?.authToken

			if (shouldRefresh) {
				const token = await refreshAccessTokenOnce()
				if (token) {
					liveAccessToken = token
					try {
						resolve(await attempt())
						return
					} catch (retryError: unknown) {
						reject(retryError)
						return
					}
				}
				// Refresh failed: the session is over. The resource route has
				// already destroyed the cookie; send the user to login.
				if (typeof window !== 'undefined') {
					window.location.assign('/login')
				}
				reject(error)
				return
			}

			if (error instanceof Response && error.status === 403) {
				reject(
					new Error(
						"You can't perform this action. Please contact your administrator.",
					),
				)
				return
			}

			reject(error)
		}
	})
}

export function fetchServer<T>(
	path: string,
	config?: FetchClientConfig,
): Promise<HttpResponse<T>> {
	return new Promise(async (resolve, reject) => {
		const headers = new Headers({
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...config?.headers,
		})

		try {
			let userToken: string | undefined

			if (config?.authToken) {
				userToken = config.authToken
			}

			if (!config?.isUnAuthorizedRequest && userToken && userToken.length) {
				headers.append('Authorization', `Bearer ${userToken}`)
			}

			const response = await transport(path, {
				...config,
				headers,
			})

			if (response.status === 204) {
				const res: HttpResponse<T> = {
					...response,
					parsedBody: {} as T,
				}
				return resolve(res)
			}

			const contentType = response.headers.get('Content-Type')

			let parsedBody
			if (contentType?.includes('json')) {
				parsedBody = await response.json()
			} else {
				parsedBody = await response.text()
			}

			const res: HttpResponse<T> = {
				...response,
				parsedBody,
			}

			resolve(res)
		} catch (error: unknown) {
			reject(error)
		}
	})
}
