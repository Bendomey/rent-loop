import { redirect } from 'react-router'
import type { Route } from './+types/_auth._property.properties.$propertySlug._index'
import { getPropertyBySlug } from '~/api/properties'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { NOT_FOUND_ROUTE } from '~/lib/constants'
import { getDomainUrl } from '~/lib/misc'
import { PropertyMiddlewareModule } from '~/modules'

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	if (!authToken) {
		return redirect('/login')
	}

	try {
		const property = await getPropertyBySlug(params.propertySlug, {
			authToken,
			baseUrl,
		})

		if (!property) {
			throw new Error('Property not found')
		}

		context.set(propertyContext, property)
		return {
			origin: getDomainUrl(request),
			property,
		}
	} catch {
		return redirect(NOT_FOUND_ROUTE)
	}
}

export default PropertyMiddlewareModule
