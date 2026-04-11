import { redirect, type MiddlewareFunction } from 'react-router'
import { userContext } from './auth.context.server'
import { getAuthSession, saveAuthSession } from './auth.session.server'
import { clientContext } from './client.context.server'

export const clientMiddleware: MiddlewareFunction = async ({
	request,
	context,
}) => {
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	const selectedClientId = authSession.get('selectedClientId')

	if (!authToken) return

	const userData = context.get(userContext)
	if (!userData) return

	// No client selected → redirect to picker (unless already going there)
	const url = new URL(request.url)
	if (!selectedClientId && url.pathname !== '/select-client') {
		return redirect('/select-client')
	}

	if (!selectedClientId) return

	// Verify the selected client is still valid for this user
	const clientUser = userData.user.client_users.find(
		(cu) => cu.client_id === selectedClientId,
	)

	if (!clientUser) {
		// selectedClientId is stale — clear it and re-pick
		authSession.unset('selectedClientId')
		return redirect('/select-client', {
			headers: { 'Set-Cookie': await saveAuthSession(authSession) },
		})
	}

	context.set(clientContext, { clientUser })
}
