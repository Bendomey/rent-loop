import type { Route } from './+types/privacy-policy'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PrivacyPolicy } from '~/modules'

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

	return getSocialMetas({
		url,
		origin: loaderData.origin,
		title: 'Privacy Policy — RentLoop',
		description:
			'RentLoop Privacy Policy — how we collect, use, and protect your personal data.',
	})
}

export default PrivacyPolicy
