import { redirect } from 'react-router'
import type { Route } from './+types/_auth._dashboard.properties.new'
import { createProperty } from '~/api/properties'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { replaceNullUndefinedWithUndefined } from '~/lib/actions/utils.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { NewPropertyModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export const handle = {
	breadcrumb: 'Add New',
}

export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))

	let formData = await request.formData()
	const type = formData.get('type') as Property['type']
	const status = formData.get('status') as Property['status']
	const name = formData.get('name') as string
	const description = formData.get('description') as string | null
	const tags = (formData.getAll('tags') as string[])?.filter(Boolean) ?? []
	const gps_address = formData.get('gps_address') as string
	const address = formData.get('address') as string
	const city = formData.get('city') as string
	const region = formData.get('region') as string
	const country = formData.get('country') as string
	const images = (formData.getAll('images') as string[])?.filter(Boolean) ?? []
	const latitude = parseFloat(formData.get('latitude') as string)
	const longitude = parseFloat(formData.get('longitude') as string)

	try {
		const property = await createProperty(
			replaceNullUndefinedWithUndefined({
				type,
				status,
				name,
				description,
				tags,
				gps_address,
				address,
				city,
				region,
				country,
				images,
				latitude,
				longitude,
			}),
			{
				baseUrl,
				authToken: authSession.get('authToken'),
			},
		)

		if (!property) {
			throw new Error('Property creation returned no data')
		}

		return redirect(`/properties/${property.id}`)
	} catch {
		return { error: 'Failed to create property' }
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Add Property | ${APP_NAME}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default NewPropertyModule
