import { test as base } from '@playwright/test'

/**
 * The suite's `test`, with product tours suppressed.
 *
 * driver.js tours auto-start on first visit to the property overview, lease
 * detail, application detail and invoices screens. Each paints a full-screen
 * `svg.driver-overlay` that intercepts pointer events, so every click on those
 * pages retries until timeout — the failure reads as "element not stable",
 * which points nowhere near a product tour.
 *
 * `useTour` skips a tour when `localStorage[key] === 'true'`, and every key
 * begins `rent-loop:tour`. Patching the getter rather than seeding the known
 * keys means a tour added later cannot silently start blocking the suite.
 *
 * Specs import { test, expect } from '../lib/test' rather than from
 * '@playwright/test'.
 */
export const test = base.extend({
	// The second argument is Playwright's fixture-provide callback. It is
	// conventionally named `use`, but that trips eslint's react-hooks rule,
	// which reads `use(...)` as a React Hook called outside a component. The
	// name is arbitrary, so renaming it beats suppressing the rule.
	page: async ({ page }, provide) => {
		await page.addInitScript(() => {
			const original = Storage.prototype.getItem
			Storage.prototype.getItem = function (key: string) {
				if (typeof key === 'string' && key.startsWith('rent-loop:tour')) {
					return 'true'
				}
				return original.call(this, key)
			}
		})
		await provide(page)
	},
})

export { expect } from '@playwright/test'
