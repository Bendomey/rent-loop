import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId.settings.documents.$documentId._index'
import { getDocument } from '~/api/documents'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { NOT_FOUND_ROUTE } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { SingleDocumentModule } from '~/modules'

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	if (!authToken) {
		return redirect('/login')
	}
	const clientUserProperty = context.get(propertyContext)

	try {
		const document = await getDocument(params.documentId, {
			authToken,
			baseUrl,
		})
		return {
			origin: getDomainUrl(request),
			document,
			clientUserProperty,
		}
	} catch {
		return redirect(NOT_FOUND_ROUTE)
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
