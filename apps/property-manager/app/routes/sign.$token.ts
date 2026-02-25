import type { Route } from './+types/sign.$token'
import { verifySigningToken } from '~/api/signing'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PublicSigningModule } from '~/modules/public-signing'

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS

	try {
		const payload = await verifySigningToken(params.token, { baseUrl })

		// if document is invalid, return expired response to show the "Link Expired" message instead of throwing an error
		if (payload?.document?.size === 0) {
			return {
				signingToken: null,
				expired: true,
				origin: getDomainUrl(request),
			}
		}

		return {
			signingToken: payload,
			expired: false,
			origin: getDomainUrl(request),
		}
	} catch {
		return {
			signingToken: null,
			expired: true,
			origin: getDomainUrl(request),
		}
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: `Sign Document | ${loaderData?.signingToken?.document?.title ?? 'Rent-Loop'}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default PublicSigningModule
