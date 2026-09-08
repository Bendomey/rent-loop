import { data } from 'react-router'
import type { Route } from './+types/blog.$slug'
import { getBlogPostBySlug } from '~/content/blog'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import {
	getBlogPostingSchema,
	getBreadcrumbSchema,
	getSocialMetas,
	pageKeywords,
} from '~/lib/seo'
import { BlogPostModule } from '~/modules'

export async function loader({ request, params }: Route.LoaderArgs) {
	const post = getBlogPostBySlug(params.slug)
	if (!post) {
		throw data(null, { status: 404 })
	}
	return {
		origin: getDomainUrl(request),
		meta: post.meta,
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const url = getDisplayUrl({
		origin: loaderData.origin,
		path: location.pathname,
	})

	const meta = getSocialMetas({
		title: `${loaderData.meta.title} | RentLoop Blog`,
		description: loaderData.meta.description,
		url,
		origin: loaderData.origin,
		keywords: pageKeywords.blog,
		...(loaderData.meta.coverImage
			? { images: [loaderData.meta.coverImage] }
			: {}),
	})

	const structuredData = [
		getBlogPostingSchema({
			origin: loaderData.origin,
			url,
			title: loaderData.meta.title,
			description: loaderData.meta.description,
			datePublished: loaderData.meta.date,
			author: loaderData.meta.author,
			image: loaderData.meta.coverImage,
		}),
		getBreadcrumbSchema(loaderData.origin, [
			{ name: 'Home', path: '/' },
			{ name: 'Blog', path: '/blog' },
			{ name: loaderData.meta.title, path: `/blog/${loaderData.meta.slug}` },
		]),
	]

	return [...meta, { 'script:ld+json': structuredData }]
}

export default BlogPostModule
