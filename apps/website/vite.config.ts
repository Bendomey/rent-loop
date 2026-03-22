import mdx from '@mdx-js/rollup'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import rehypeSlug from 'rehype-slug'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [
		{
			...mdx({
				remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
				rehypePlugins: [rehypeSlug],
			}),
			enforce: 'pre',
		},
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
	],
})
