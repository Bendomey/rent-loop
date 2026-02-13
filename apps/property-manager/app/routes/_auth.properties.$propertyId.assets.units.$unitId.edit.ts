import type { Route } from './+types/_auth.properties.$propertyId.assets.units.$unitId.edit'
import { getPropertyUnitForServer } from '~/api/units/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { EditPropertyAssetUnitModule } from '~/modules/properties/property/assets/units/edit'

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')

	const unit = await getPropertyUnitForServer(
		{
			property_id: params.propertyId,
			unit_id: params.unitId,
			populate: ['Property', 'PropertyBlock'],
		},
		{
			authToken,
			baseUrl,
		},
	)

	return { unit }
}

export const handle = {
	breadcrumb: 'Edit',
}

export default EditPropertyAssetUnitModule
