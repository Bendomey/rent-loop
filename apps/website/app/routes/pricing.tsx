import type { Route } from './+types/pricing'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { billingFaqs } from '~/lib/plans'
import {
	getBreadcrumbSchema,
	getFaqSchema,
	getSocialMetas,
	pageKeywords,
} from '~/lib/seo'
import { PricingModule } from '~/modules'

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
		title: 'Pricing — Property Management Software | Rentloop',
		description:
			'Start free with up to 3 units, then choose Starter or Growth from GHS 149/month. Billed monthly or yearly in cedis, with Mobile Money, bank transfer and card accepted.',
		url,
		origin: loaderData.origin,
		keywords: pageKeywords.pricing,
	})

	const structuredData = [
		getFaqSchema(billingFaqs),
		getBreadcrumbSchema(loaderData.origin, [
			{ name: 'Home', path: '/' },
			{ name: 'Pricing', path: '/pricing' },
		]),
	]

	return [...meta, { 'script:ld+json': structuredData }]
}

export default PricingModule
