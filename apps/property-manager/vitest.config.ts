import { defineConfig } from 'vitest/config'

// Scoped to app/lib deliberately: these are pure functions with no React, no
// network and no router. Component testing would need jsdom and a much larger
// setup, and the design boards are the visual reference instead.
export default defineConfig({
	test: {
		include: ['app/lib/**/*.test.ts'],
		environment: 'node',
	},
	resolve: {
		alias: { '~': new URL('./app/', import.meta.url).pathname },
	},
})
