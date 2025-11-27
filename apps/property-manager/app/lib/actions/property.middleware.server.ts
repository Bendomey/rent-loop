import { redirect, type MiddlewareFunction } from 'react-router'
import { NOT_FOUND_ROUTE } from '../constants'
import { userContext } from './auth.context.server'
import { getAuthSession } from './auth.session.server'
import { environmentVariables } from './env.server'
import { propertyContext } from './property.context.server'
import { getClientUserPropertiesForServer } from '~/api/client-user-properties/server'

export const propertyMiddleware: MiddlewareFunction = async ({
	request,
	context,
	params
}) => {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	if (!authToken) {
		return redirect('/login')
	}

	// make sure they're allowed to access this property
	const authData = context.get(userContext)
	if (!authData) {
		return redirect('/login')
	}

	try {
		const clientUserProperties = await getClientUserPropertiesForServer(
			{
				filters: {
					property_id: params.propertyId,
					client_user_id: authData.clientUser.id,
				},
				pagination: { page: 1, per: 1 },
				populate: ['Property'],
				search: {},
				sorter: {},
			},
			{
				authToken,
				baseUrl,
			},
		)

		const clientUserProperty = clientUserProperties?.rows?.at(0)

		// no access
		if (!clientUserProperty) {
			return redirect('/')
		}

		context.set(propertyContext, clientUserProperty)
	} catch {
		return redirect(NOT_FOUND_ROUTE)
	}
}
