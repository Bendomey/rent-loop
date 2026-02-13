import type { Route } from './+types/_auth._dashboard.settings.payment-accounts.$paymentAccountId.edit'
import { getPaymentAccountForServer } from '~/api/payment-accounts/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { EditPaymentAccountModule } from '~/modules'

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	const payment_account_id = params.paymentAccountId

	try {
		const paymentAccount = await getPaymentAccountForServer(
			{ payment_account_id: payment_account_id },
			{
				authToken,
				baseUrl,
			},
		)
		return {
			origin: getDomainUrl(request),
			paymentAccount: paymentAccount,
		}
	} catch {
		throw new Error('Failed to load payment account')
	}
}

export const handle = {
	breadcrumb: 'Edit Payment Account',
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Edit Payment Account | ${loaderData?.paymentAccount?.identifier ?? ''}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default EditPaymentAccountModule
