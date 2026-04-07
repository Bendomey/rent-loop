import type { Route } from './+types/_auth'
import { userContext } from '~/lib/actions/auth.context.server'
import { authMiddleware } from '~/lib/actions/auth.middleware.server'
import { clientContext } from '~/lib/actions/client.context.server'
import { clientMiddleware } from '~/lib/actions/client.middleware.server'
import { AuthMiddlewareModule } from '~/modules'

export const middleware = [authMiddleware, clientMiddleware]

export async function loader({ context }: Route.LoaderArgs) {
	const authData = context.get(userContext)
	const clientData = context.get(clientContext)

	return {
		currentUser: authData?.user,
		clientUserData: clientData?.clientUser,
	}
}

export default AuthMiddlewareModule
