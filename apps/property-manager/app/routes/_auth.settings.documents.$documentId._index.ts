import { redirect } from 'react-router'
import type { Route } from './+types/_auth.settings.documents.$documentId._index'
import { getDocument } from '~/api/documents'
import {
	getAuthSession,
	saveAuthSession,
} from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { SingleDocumentModule } from '~/modules'

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	if (!authToken) {
		return redirect('/login')
	}

	try {
		const document = await getDocument(params.documentId, {
			authToken,
			baseUrl,
		})
		return {
			origin: getDomainUrl(request),
			document,
		}
	} catch {
		authSession.flash(
			'error',
			"The document you're looking for does not exist.",
		)
		return redirect('/settings/documents', {
			headers: {
				'Set-Cookie': await saveAuthSession(authSession),
			},
		})
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
