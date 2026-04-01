/// <reference lib="WebWorker" />
declare const self: ServiceWorkerGlobalScope

import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
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
registerRoute(
	({ url }) => url.hostname.includes('rentloopapp.com'),
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

// Cache /offline at install so it works with zero network
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open('offline-fallback').then((cache) => cache.add('/offline')),
	)
})

// Only skip waiting when the client explicitly sends SKIP_WAITING
// (triggered by the update prompt) — never skip unconditionally mid-session
self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') {
		void self.skipWaiting()
	}
})
