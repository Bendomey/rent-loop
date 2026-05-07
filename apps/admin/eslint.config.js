import { config as defaultConfig } from '@epic-web/config/eslint'

/** @type {import("eslint").Linter.Config[]} */
export default [
	...defaultConfig,
	{
		rules: {
			'import/consistent-type-specifier-style': 'off',
			'import/no-duplicates': 'off',
		},
	},
	{
		// sw.ts is excluded from the main tsconfig (WebWorker types conflict with app types)
		// and is only processed by Workbox at build time — ignore it from linting
		ignores: ['app/sw.ts'],
	},
]
