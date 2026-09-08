import type { Route } from './+types/managers'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getBreadcrumbSchema, getSocialMetas, pageKeywords } from '~/lib/seo'
import { ManagersPage } from '~/modules/managers'

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
		title: 'Property Management Software for Landlords',
		description:
			'Rent collection, tenant management, maintenance tracking and tenancy agreements in one dashboard. Built for landlords, caretakers and hostel operators.',
		keywords: pageKeywords.managers,
	})

	const structuredData = [
		getBreadcrumbSchema(loaderData.origin, [
			{ name: 'Home', path: '/' },
			{ name: 'For Managers', path: '/managers' },
		]),
	]

	return [...meta, { 'script:ld+json': structuredData }]
}

export default ManagersPage
