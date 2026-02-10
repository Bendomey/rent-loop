import type { Route } from './+types/_index'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import {
	getOrganizationSchema,
	getSocialMetas,
	getSoftwareAppSchema,
	getWebsiteSchema,
} from '~/lib/seo'
import { Home } from '~/modules'

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
		url,
		origin: loaderData.origin,
		description:
			'Your all-in-one property management solution designed to simplify renting for landlords and delight tenants.',
	})

	const structuredData = [
		getOrganizationSchema(loaderData.origin),
		getWebsiteSchema(loaderData.origin),
		getSoftwareAppSchema(loaderData.origin),
	]

	return [
		...meta,
		{
			'script:ld+json': structuredData,
		},
	]
}

export default Home
