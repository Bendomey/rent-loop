import type { Route } from './+types/_auth.properties.$propertyId.assets.units._index'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDomainUrl } from '~/lib/misc'
import { EditPropertyAssetUnitModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)

	if (clientUserProperty?.role !== 'MANAGER') {
		throw new Response(null, { status: 403, statusText: 'Unauthorized' })
	}

	return { origin: getDomainUrl(request), clientUserProperty }
}

export const handle = {
	breadcrumb: 'Edit',
}

export default EditPropertyAssetUnitModule
