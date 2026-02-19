import { redirect } from 'react-router'
import type { Route } from './+types/sign.$token'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { NOT_FOUND_ROUTE } from '~/lib/constants'
import { fetchServer } from '~/lib/transport'
import { PublicSigningModule } from '~/modules/public-signing'
import type { SignatureRole } from '~/components/editor/nodes/signature-node'

interface SigningTokenPayload {
	document: RentloopDocument
	signer_role: SignatureRole
	signer_name: string | null
	application_code: string
}

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS

	try {
		// Validate the signing token and get the document + signer info
		// This endpoint is unauthenticated — the token itself is the authorization
		const response = await fetchServer<ApiResponse<SigningTokenPayload>>(
			`${baseUrl}/v1/signing/${params.token}/verify`,
			{ method: 'GET' },
		)

		const payload = response.parsedBody.data

		return {
			origin: getDomainUrl(request),
			document: payload.document,
			signerRole: payload.signer_role,
			signerName: payload.signer_name,
			applicationCode: payload.application_code,
		}
	} catch {
		return redirect(NOT_FOUND_ROUTE)
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: `Sign Document | ${loaderData?.document?.title ?? 'Rent-Loop'}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default PublicSigningModule
