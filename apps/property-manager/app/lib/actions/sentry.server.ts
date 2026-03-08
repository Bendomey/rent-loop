import * as Sentry from '@sentry/node'
import { environmentVariables } from '~/lib/actions/env.server'

let initialized = false

function ensureInitialized() {
	if (initialized) return
	const env = environmentVariables()
	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.NODE_ENV,
	})
	initialized = true
}

export function captureException(error: unknown) {
	ensureInitialized()
	Sentry.captureException(error)
}
