/// <reference lib="WebWorker" />
declare const self: ServiceWorkerGlobalScope

import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute } from 'workbox-precaching'
import {
	NavigationRoute,
	registerRoute,
	setCatchHandler,
} from 'workbox-routing'
import {
	CacheFirst,
	NetworkFirst,
	StaleWhileRevalidate,
} from 'workbox-strategies'

// Injected at build time by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)

// Navigation (SSR HTML): network-first — never cache stale SSR responses
const navHandler = new NetworkFirst({
	cacheName: 'navigation-cache',
	networkTimeoutSeconds: 3,
	plugins: [new CacheableResponsePlugin({ statuses: [200] })],
})
registerRoute(
	new NavigationRoute(navHandler, {
		denylist: [/\/api\//],
	}),
)

// External API: network-first, short cache for degraded network
// Narrowed to the exact API subdomain + GET only
// to avoid caching mutations or unrelated cross-origin resources
registerRoute(
	({ url, request }) =>
		url.hostname === 'api.rentloopapp.com' && request.method === 'GET',
	new NetworkFirst({
		cacheName: 'api-cache',
		networkTimeoutSeconds: 5,
		plugins: [
			new CacheableResponsePlugin({ statuses: [200] }),
			new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 }),
		],
	}),
)

// Google Fonts CSS: stale-while-revalidate
registerRoute(
	({ url }) => url.origin === 'https://fonts.googleapis.com',
	new StaleWhileRevalidate({ cacheName: 'google-fonts-css' }),
)

// Google Fonts files: cache-first (immutable binaries)
registerRoute(
	({ url }) => url.origin === 'https://fonts.gstatic.com',
	new CacheFirst({
		cacheName: 'google-fonts-files',
		plugins: [
			new CacheableResponsePlugin({ statuses: [200] }),
			new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365 }),
		],
	}),
)

// Serve cached /offline page when a navigation request fails (no network + not in navigation-cache)
setCatchHandler(async ({ request }) => {
	if (request.destination === 'document') {
		const cached = await caches.match('/offline', {
			cacheName: 'offline-fallback',
		})
		return cached ?? Response.error()
	}
	return Response.error()
})

// Cache /offline at install so it works with zero network
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open('offline-fallback').then((cache) =>
			cache.add('/offline').catch((error) => {
				// Don't fail the install if /offline can't be cached (e.g., first load while offline)
				console.warn('SW: failed to cache /offline during install', error)
			}),
		),
	)
})

// Only skip waiting when the client explicitly sends SKIP_WAITING
// (triggered by the update prompt) — never skip unconditionally mid-session
self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') {
		void self.skipWaiting()
	}
})
