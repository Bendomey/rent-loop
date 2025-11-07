import type { Route } from './+types/_auth'
import { getClientUserProperties } from '~/api/properties'
import { userContext } from '~/lib/actions/auth.context.server'
import { authMiddleware } from '~/lib/actions/auth.middleware.server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { AuthMiddlewareModule } from '~/modules'

export const middleware = [authMiddleware]

export async function loader({ context, request }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authData = context.get(userContext)
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')

	const clientUserPropertiesResponse = await getClientUserProperties(
		{
			pagination: { page: 1, per: 50 },
			sorter: {},
			filters: {},
			search: {},
			populate: ['Property'],
		},
		{
			baseUrl,
			authToken,
		},
	)

	return {
		currentUserData: authData,
		clientUserProperties: clientUserPropertiesResponse,
	}
}

export default AuthMiddlewareModule
