export const NODE_ENV = process.env.NODE_ENV
export const APP_NAME = 'rentloop'
export const APP_DOMAIN =
	NODE_ENV === 'production' ? 'rentloop.app' : 'localhost'

export const GITHUB_REPO_URL = 'https://github.com/Bendomey/rent-loop'
export const MYLES_PUDO_URL = 'https://mylespudo.com'

export const USER_CIPHER = 'rentloop-account'

export const QUERY_KEYS = {
	CURRENT_USER: 'current-user',
} as const

// base64 1px png's generated from https://png-pixel.com/
const placeholderColor =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8+/79fwAJaAPMsmQeyQAAAABJRU5ErkJggg==' // grey-10 as 1px png in base64
export const blurDataURL = `data:image/png;base64,${placeholderColor}`
