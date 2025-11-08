import type { Route } from './+types/_auth'
import { userContext } from '~/lib/actions/auth.context.server'
import { authMiddleware } from '~/lib/actions/auth.middleware.server'
import { AuthMiddlewareModule } from '~/modules'

export const middleware = [authMiddleware]

export async function loader({ context }: Route.LoaderArgs) {
	const authData = context.get(userContext)

	return {
		currentUserData: authData?.clientUser,
		clientUserProperties: authData?.clientUserProperties,
	}
}

export default AuthMiddlewareModule
