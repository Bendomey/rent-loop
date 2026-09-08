import type { Route } from './+types/tenants._index'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getBreadcrumbSchema, getSocialMetas, pageKeywords } from '~/lib/seo'
import { TenantsPage } from '~/modules/tenants/page'

export async function loader({ request }: Route.LoaderArgs) {
	return { origin: getDomainUrl(request) }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const url = getDisplayUrl({
		origin: loaderData.origin,
		path: location.pathname,
	})
	const meta = getSocialMetas({
		url,
		origin: loaderData.origin,
		title: 'Pay Rent with Mobile Money & Track Maintenance | Rentloop',
		description:
			'Pay rent with MTN, Telecel or AirtelTigo Mobile Money, get an instant receipt, submit maintenance requests and find your tenancy agreement — all in one app.',
		keywords: pageKeywords.tenants,
	})

	const structuredData = [
		getBreadcrumbSchema(loaderData.origin, [
			{ name: 'Home', path: '/' },
			{ name: 'For Tenants', path: '/tenants' },
		]),
	]

	return [...meta, { 'script:ld+json': structuredData }]
}

export default TenantsPage
