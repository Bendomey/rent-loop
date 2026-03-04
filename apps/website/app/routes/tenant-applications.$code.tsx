import type { Route } from './+types/tenant-applications.$code'
import { getDomainUrl, getDisplayUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { TenantApplicationTrackingModule } from '~/modules'

export async function loader({ request, params }: Route.LoaderArgs) {
	return {
		code: params.code,
		origin: getDomainUrl(request),
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: `Track Application ${loaderData.code} | Rent-Loop`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default TenantApplicationTrackingModule
