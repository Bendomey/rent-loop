import type { Route } from './+types/download'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getBreadcrumbSchema, getSocialMetas, pageKeywords } from '~/lib/seo'
import { DownloadModule } from '~/modules'

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
		title: 'Download the Rentloop Tenant App — Android & iOS',
		description:
			'Get the free Rentloop app for Android and iOS. Pay rent with Mobile Money, keep every receipt, track maintenance requests and stay in touch with your landlord.',
		url,
		origin: loaderData.origin,
		keywords: pageKeywords.download,
	})

	const structuredData = [
		getBreadcrumbSchema(loaderData.origin, [
			{ name: 'Home', path: '/' },
			{ name: 'Download', path: '/download' },
		]),
	]

	return [...meta, { 'script:ld+json': structuredData }]
}

export default DownloadModule
