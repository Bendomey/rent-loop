import { redirect } from 'react-router'
import type { Route } from './+types/_auth.settings.documents.$documentId._index'
import { getDocument } from '~/api/documents'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { SingleDocumentModule } from '~/modules'

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	if (!authToken) {
		return redirect('/login')
	}

	const clientId = safeString(authSession.get('selectedClientId'))

	try {
		const document = await getDocument(clientId, params.documentId, {
			authToken,
			baseUrl,
		})
		return {
			origin: getDomainUrl(request),
			document,
		}
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Edit Document | ${APP_NAME}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default SingleDocumentModule
