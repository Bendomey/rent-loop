import { getTerminateLeaseForServer } from '~/api/lease-terminations/server'
import type { Route } from './+types/_auth.properties.$propertyId.occupancy.leases.$leaseId_.terminate.$terminateId'
import { getLeaseForServer } from '~/api/leases/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { LeaseTerminateModule } from '~/modules/properties/property/occupancy/leases/lease/terminate'

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	const clientId = safeString(authSession.get('selectedClientId'))

	try {
		const lease = await getLeaseForServer(
			clientId,
			{ lease_id: params.leaseId, property_id: params.propertyId },
			{ authToken, baseUrl },
		)
		const terminateLease = await getTerminateLeaseForServer(
			clientId,
			{
				lease_id: params.leaseId,
				property_id: params.propertyId,
				terminationId: params.terminateId,
			},
			{ authToken, baseUrl },
		)
		return {
			origin: getDomainUrl(request),
			lease,
			terminateLease,
			clientUserProperty,
		}
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export const handle = {
	breadcrumb: (data: Awaited<ReturnType<typeof loader>>) =>
		`Terminate ${data?.lease?.code ?? 'Lease'}`,
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: `Terminate ${loaderData?.lease?.code ?? 'Lease'} | ${loaderData?.clientUserProperty?.property?.name ?? ''}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default LeaseTerminateModule
