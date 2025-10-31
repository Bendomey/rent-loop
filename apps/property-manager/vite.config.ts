import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
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
