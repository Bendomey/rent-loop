import { redirect } from 'react-router'
import type { Route } from './+types/sign.$token'
import { verifySigningToken } from '~/api/signing'
import { environmentVariables } from '~/lib/actions/env.server'
import { NOT_FOUND_ROUTE } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PublicSigningModule } from '~/modules/public-signing'

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS

	try {
		const payload = await verifySigningToken(params.token, { baseUrl })

		return {
			signingToken: payload,
			origin: getDomainUrl(request),
		}
	} catch {
		return redirect(NOT_FOUND_ROUTE)
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
