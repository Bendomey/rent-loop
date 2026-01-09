import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId.tenants.applications._index'
import { createTenantApplication } from '~/api/tenant-applications'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { replaceNullUndefinedWithUndefined } from '~/lib/actions/utils.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { NewPropertyTenantApplicationModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)

	return {
		origin: getDomainUrl(request),
		clientUserProperty,
	}
}

export const handle = {
	breadcrumb: 'New Tenant Application',
}

export async function action({ request, context }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const clientUserProperty = context.get(propertyContext)

	let formData = await request.formData()
	const property_id = formData.get('property_id') as string
	const desired_unit_id = formData.get('desired_unit_id') as string
	const on_boarding_method = formData.get(
		'on_boarding_method',
	) as TenantApplication['on_boarding_method']
	const first_name = formData.get('first_name') as string
	const other_names = formData.get('other_names') as string
	const last_name = formData.get('last_name') as string
	const email = formData.get('email') as string
	const phone = formData.get('phone') as string
	const gender = formData.get('gender') as TenantApplication['gender']
	const marital_status = formData.get(
		'marital_status',
	) as TenantApplication['marital_status']
	const profile_photo_url = formData.get('profile_photo_url') as string
	const date_of_birth = formData.get('date_of_birth') as string
	const nationality = formData.get('nationality') as string
	const current_address = formData.get('current_address') as string
	const id_type = formData.get('id_type') as Maybe<TenantApplication['id_type']>
	const id_number = formData.get('id_number') as string
	const id_front_url = formData.get('id_front_url') as string | null
	const id_back_url = formData.get('id_back_url') as string | null
	const emergency_contact_name = formData.get(
		'emergency_contact_name',
	) as string
	const emergency_contact_phone = formData.get(
		'emergency_contact_phone',
	) as string
	const relationship_to_emergency_contact = formData.get(
		'relationship_to_emergency_contact',
	) as string
	const employment_type = formData.get(
		'employment_type',
	) as TenantApplication['employment_type']
	const occupation = formData.get('occupation') as string
	const employer = formData.get('employer') as string
	const occupation_address = formData.get('occupation_address') as string
	const proof_of_income_url = formData.get('proof_of_income_url') as
		| string
		| null
	const created_by_id = clientUserProperty?.client_user_id as ClientUser['id']

	try {
		const tenantApplication = await createTenantApplication(
			replaceNullUndefinedWithUndefined({
				property_id,
				desired_unit_id,
				on_boarding_method,
				first_name,
				other_names,
				last_name,
				email,
				phone,
				gender,
				marital_status,
				current_address,
				profile_photo_url,
				date_of_birth,
				nationality,
				id_type,
				id_number,
				id_front_url,
				id_back_url,
				emergency_contact_name,
				emergency_contact_phone,
				relationship_to_emergency_contact,
				employment_type,
				occupation,
				employer,
				occupation_address,
				proof_of_income_url,
				created_by_id,
			}),
			{
				baseUrl,
				authToken: authSession.get('authToken'),
			},
		)

		if (!tenantApplication) {
			throw new Error('Tenant application creation returned no data')
		}

		return redirect(`/properties/${property_id}/tenants/applications`)
	} catch {
		return { error: 'Failed to create tenant application' }
	}
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `New Tenant Application | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default NewPropertyTenantApplicationModule
