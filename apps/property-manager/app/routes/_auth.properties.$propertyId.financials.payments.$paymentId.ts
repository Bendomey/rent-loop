import type { Route } from './+types/_auth.properties.$propertyId.financials.payments.$paymentId'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { getInvoiceForServer } from '~/api/invoices/server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'

import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PropertyFinancialsPaymentModule } from '~/modules'

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	const payment_id = params.paymentId

	try {
		const payment = await getInvoiceForServer(
			{ invoice_id: payment_id },
			{
				authToken,
				baseUrl,
			},
		)
		return {
			origin: getDomainUrl(request),
			payment: payment,
			clientUserProperty,
		}
	} catch {
		throw new Error('Failed to load payment')
	}
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Payment | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default PropertyFinancialsPaymentModule
