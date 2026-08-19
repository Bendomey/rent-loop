/*
 * The trailing underscore on $leaseId_ opts this route out of nesting under
 * the lease detail route. Without it flat-routes makes this a CHILD of
 * .../$leaseId, which renders no <Outlet/> — so the URL changes and the page
 * does not.
 */
import type { Route } from './+types/_auth.properties.$propertyId.occupancy.leases.$leaseId_.renew'
import { getLeaseForServer } from '~/api/leases/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { resolveAuthToken } from '~/lib/actions/auth.token.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { safeString } from '~/lib/strings'
import { LeaseRenewalModule } from '~/modules'

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = await resolveAuthToken(request, context)
	const clientId = safeString(authSession.get('selectedClientId'))

	try {
		const lease = await getLeaseForServer(
			clientId,
			{ lease_id: params.leaseId, property_id: params.propertyId },
			{ authToken, baseUrl },
		)
		return { lease, propertyId: params.propertyId }
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export function meta() {
	return [{ title: 'Renew lease · Rentloop' }]
}

export default function LeaseRenewalRoute() {
	return <LeaseRenewalModule />
}
