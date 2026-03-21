import { data } from 'react-router'
import type { Route } from './+types/$'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { NotFoundModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return data({ origin: getDomainUrl(request) }, { status: 404 })
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Page Not Found | ${APP_NAME}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default NotFoundModule
