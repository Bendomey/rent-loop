import { redirect } from 'react-router'
import type { Route } from './+types/_auth._dashboard.property-managers_.new'
import { createClientApplicationForServer } from '~/api/client-applications/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { NewPropertyManagerModule } from '~/modules'

export const handle = {
	breadcrumb: 'New Property Manager',
}

export async function loader({ request }: Route.LoaderArgs) {
	return { origin: getDomainUrl(request) }
}

export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')

	const body = await request.formData()
	const getString = (key: string) => String(body.get(key) ?? '').trim()

	try {
		await createClientApplicationForServer(
			{
				name: getString('name'),
				type: getString('type') as CreateClientApplicationInput['type'],
				sub_type: getString(
					'sub_type',
				) as CreateClientApplicationInput['sub_type'],
				contact_name: getString('contact_name'),
				contact_email: getString('contact_email'),
				contact_phone_number: getString('contact_phone_number'),
				address: getString('address'),
				city: getString('city'),
				region: getString('region'),
				country: getString('country'),
				support_email: getString('support_email'),
				support_phone: getString('support_phone'),
				latitude: parseFloat(getString('latitude')) || 0,
				longitude: parseFloat(getString('longitude')) || 0,
				description: getString('description') || undefined,
				website_url: getString('website_url') || undefined,
				registration_number: getString('registration_number') || undefined,
				date_of_birth: getString('date_of_birth') || undefined,
			},
			{ baseUrl, authToken },
		)

		return redirect('/property-managers')
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: 'Failed to create property manager'
		return { error: message }
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
		title: 'New Property Manager',
	})
}

export default NewPropertyManagerModule
