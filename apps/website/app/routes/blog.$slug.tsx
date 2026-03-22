import { data } from 'react-router'
import type { Route } from './+types/blog.$slug'
import { getBlogPostBySlug } from '~/content/blog'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
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
	return getSocialMetas({
		title: `${loaderData.meta.title} | RentLoop Blog`,
		description: loaderData.meta.description,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
		...(loaderData.meta.coverImage
			? { images: [loaderData.meta.coverImage] }
			: {}),
	})
}

export default BlogPostModule
