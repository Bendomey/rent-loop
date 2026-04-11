import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId_.settings.documents.$documentId._index'
import { getDocument } from '~/api/documents'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { SingleDocumentModule } from '~/modules'

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	if (!authToken) {
		return redirect('/login')
	}
	const clientUserProperty = context.get(propertyContext)

	const clientId = safeString(authSession.get('selectedClientId'))

	try {
		const document = await getDocument(clientId, params.documentId, {
			authToken,
			baseUrl,
		})
		return {
			origin: getDomainUrl(request),
			document,
			clientUserProperty,
		}
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Edit ${loaderData?.document?.title ?? 'Document'} | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default SingleDocumentModule
