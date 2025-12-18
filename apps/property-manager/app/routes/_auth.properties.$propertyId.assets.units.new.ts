import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId.assets.units._index'
import { createPropertyUnit } from '~/api/units'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { replaceNullUndefinedWithUndefined } from '~/lib/actions/utils.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { NewPropertyAssetUnitsModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)

	return {
		origin: getDomainUrl(request),
		clientUserProperty,
	}
}

export const handle = {
	breadcrumb: 'Add Unit',
}

export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))

	let formData = await request.formData()
	const property_id = formData.get('property_id') as string
	const property_block_id = formData.get('property_block_id') as string
	const type = formData.get('type') as PropertyUnit['type']
	const status = formData.get('status') as PropertyUnit['status']
	const name = formData.get('name') as string
	const description = formData.get('description') as string | null
	const images = (formData.getAll('images') as string[])?.filter(Boolean) ?? []
	const tags = (formData.getAll('tags') as string[])?.filter(Boolean) ?? []
	const max_occupants_allowed = Number(formData.get('max_occupants_allowed'))
	const area = parseFloat(formData.get('area') as string)
	const rent_fee_currency = formData.get('rent_fee_currency') as string
	const rent_fee = Number(formData.get('rent_fee'))
	const payment_frequency = formData.get(
		'payment_frequency',
	) as PropertyUnit['payment_frequency']

	const featuresArray = formData.getAll('features') as string[]
	const features: StringRecord = {}
	featuresArray.forEach((item) => {
		const [key, value] = item.split(':')
		if (key && value) features[key] = value
	})

	try {
		const property = await createPropertyUnit(
			replaceNullUndefinedWithUndefined({
				property_id,
				property_block_id,
				type,
				status,
				name,
				description,
				images,
				tags,
				features,
				max_occupants_allowed,
				area,
				rent_fee,
				rent_fee_currency,
				payment_frequency,
			}),
			{
				baseUrl,
				authToken: authSession.get('authToken'),
			},
		)

		if (!property) {
			throw new Error('Property unit creation returned no data')
		}

		return redirect(`/properties/${property_id}/assets/units`)
	} catch {
		return { error: 'Failed to create property unit' }
	}
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Add unit | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default NewPropertyAssetUnitsModule
