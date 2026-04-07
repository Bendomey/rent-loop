import type { Route } from './+types/_auth.properties.$propertyId.financials.invoices.$invoiceId'
import { getInvoiceForServer } from '~/api/invoices/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'

import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { PropertyFinancialsPaymentModule } from '~/modules'

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	const clientId = safeString(authSession.get('selectedClientId'))
	const invoice_id = params.invoiceId

	try {
		const invoice = await getInvoiceForServer(
			clientId,
			{ invoice_id: invoice_id, property_id: params.propertyId },
			{
				authToken,
				baseUrl,
			},
		)
		return {
			origin: getDomainUrl(request),
			invoice: invoice,
			clientUserProperty,
		}
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Invoice Payment | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default PropertyFinancialsPaymentModule
