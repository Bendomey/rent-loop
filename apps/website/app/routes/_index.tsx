import type { Route } from './+types/_index'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import {
	getOrganizationSchema,
	getSocialMetas,
	getSoftwareAppSchema,
	getWebsiteSchema,
	pageKeywords,
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
		title: 'Property Management Software | Rentloop',
		description:
			'Manage properties, tenants, rent and maintenance in one place. Built for landlords and property managers — collect rent in cedis via Mobile Money or bank transfer.',
		keywords: pageKeywords.home,
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
