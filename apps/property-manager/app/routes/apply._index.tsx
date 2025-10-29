import { redirect } from 'react-router'
import type { Route } from './+types/apply._index'
import { applyAsAClient } from '~/api/client-applications'
import { environmentVariables } from '~/lib/actions/env.server'
import { replaceNullUndefinedWithUndefined } from '~/lib/actions/utils.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { ApplyModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS

	let formData = await request.formData()
	const address = formData.get('address') as string
	const city = formData.get('city') as string
	const contact_email = formData.get('contact_email') as string
	const contact_name = formData.get('contact_name') as string
	const contact_phone_number = formData.get('contact_phone_number') as string
	const country = formData.get('country') as string
	const date_of_birth = formData.get('date_of_birth') as string
	const description = formData.get('description') as string | null
	const id_document_url = formData.get('id_document_url') as string | null
	const id_expiry = formData.get('id_expiry') as string | null
	const id_number = formData.get('id_number') as string | null
	const id_type = formData.get('id_type') as Maybe<ClientApplication['id_type']>
	const latitude = parseFloat(formData.get('latitude') as string)
	const logo_url = formData.get('logo_url') as string | null
	const longitude = parseFloat(formData.get('longitude') as string)
	const name = formData.get('name') as string
	const region = formData.get('region') as string
	const registration_number = formData.get('registration_number') as string
	const sub_type = formData.get('sub_type') as ClientApplication['sub_type']
	const support_email = formData.get('support_email') as string
	const support_phone = formData.get('support_phone') as string
	const type = formData.get('type') as ClientApplication['type']
	const website_url = formData.get('website_url') as string | null

	try {
		await applyAsAClient(
			replaceNullUndefinedWithUndefined({
				address,
				city,
				contact_email,
				contact_name,
				contact_phone_number,
				country,
				date_of_birth,
				description,
				id_document_url,
				id_expiry,
				id_number,
				id_type,
				latitude,
				logo_url,
				longitude,
				name,
				region,
				registration_number,
				sub_type,
				support_email,
				support_phone,
				type,
				website_url,
			}),
			{
				baseUrl,
			},
		)

		return redirect('/apply/success')
	} catch {
		return { error: 'Failed to apply' }
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Apply as a Property Owner - ${APP_NAME}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default ApplyModule
