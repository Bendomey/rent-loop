import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
		VitePWA({
			strategies: 'injectManifest',
			srcDir: 'app',
			filename: 'sw.ts',
			registerType: 'prompt',
			injectRegister: false,
			devOptions: {
				enabled: true,
				type: 'module',
			},
			manifest: {
				name: 'Rentloop Property Manager',
				short_name: 'Rentloop',
				description: 'Property rental lifecycle management',
				theme_color: '#e8472b',
				background_color: '#ffffff',
				display: 'standalone',
				start_url: '/',
				icons: [
					{
						src: '/icons/manifest-icon-192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: '/icons/manifest-icon-512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: '/icons/manifest-icon-192.maskable.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable',
					},
					{
						src: '/icons/manifest-icon-512.maskable.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
			},
			injectManifest: {
				globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
				globDirectory: 'build/client',
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB — entry bundle exceeds 2 MiB default
			},
		}),
	],
	build: {
		sourcemap: false, // Disable sourcemaps in production to avoid sourcemap errors
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Group the large emoji list into its own chunk
					if (id.includes('emoji-list')) {
						return 'emoji-data'
					}

					// Group node_modules into vendor chunk
					if (id.includes('node_modules')) {
						return 'vendor'
					}
				},
			},
		},
	},
})
