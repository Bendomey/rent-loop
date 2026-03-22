import type { Route } from './+types/blog._index'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { BlogIndexModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: 'Blog | RentLoop',
		description:
			'Guides, tips, and updates from the Rentloop team. Learn how to manage your rental properties smarter.',
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default BlogIndexModule
