import { getSortedBlogPosts } from '~/content/blog'
import { APP_DOMAIN, NODE_ENV } from '~/lib/constants'

export async function loader() {
	const protocol = NODE_ENV === 'production' ? 'https' : 'http'
	const baseUrl = `${protocol}://${APP_DOMAIN}`

	const staticRoutes = [
		{ url: '/', priority: '1.0', changefreq: 'weekly' },
		{ url: '/pricing', priority: '0.8', changefreq: 'monthly' },
		{ url: '/download', priority: '0.8', changefreq: 'monthly' },
		{ url: '/blog', priority: '0.8', changefreq: 'weekly' },
		{ url: '/terms', priority: '0.3', changefreq: 'yearly' },
		{ url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
	]

	const blogRoutes = getSortedBlogPosts().map((post) => ({
		url: `/blog/${post.meta.slug}`,
		priority: '0.7',
		changefreq: 'monthly',
		lastmod: post.meta.date,
	}))

	const routes = [...staticRoutes, ...blogRoutes]

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
	.map(
		(route) => `  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${'lastmod' in route ? route.lastmod : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
	)
	.join('\n')}
</urlset>`

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600',
		},
	})
}
