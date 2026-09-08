import type { Route } from './+types/blog._index'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getBreadcrumbSchema, getSocialMetas, pageKeywords } from '~/lib/seo'
import { BlogIndexModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const url = getDisplayUrl({
		origin: loaderData.origin,
		path: location.pathname,
	})

	const meta = getSocialMetas({
		title: 'Property Management Insights | Rentloop Blog',
		description:
			'Guides on collecting rent, rent advance, tenancy agreements and running a rental portfolio — from the Rentloop team.',
		url,
		origin: loaderData.origin,
		keywords: pageKeywords.blog,
	})

	const structuredData = [
		getBreadcrumbSchema(loaderData.origin, [
			{ name: 'Home', path: '/' },
			{ name: 'Blog', path: '/blog' },
		]),
	]

	return [...meta, { 'script:ld+json': structuredData }]
}

export default BlogIndexModule
