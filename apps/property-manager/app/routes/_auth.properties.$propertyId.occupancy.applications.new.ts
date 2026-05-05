import { redirect } from 'react-router'
import { z } from 'zod'
import type { Route } from './+types/_auth.properties.$propertyId.occupancy.applications._index'
import { createTenantApplication } from '~/api/tenant-applications'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { replaceNullUndefinedWithUndefined } from '~/lib/actions/utils.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { NewPropertyTenantApplicationModule } from '~/modules'

const CreateTenantApplicationSchema = z.object({
	property_id: z.string().min(1, 'Property is required'),
	desired_unit_id: z.string().min(1, 'Unit is required'),
	on_boarding_method: z.enum(['SELF', 'ADMIN']),
	first_name: z.string().min(1, 'First name is required'),
	other_names: z.string().nullable().default(null),
	last_name: z.string().min(1, 'Last name is required'),
	email: z.email('Invalid email address').optional(),
	phone: z.string().min(1, 'Phone number is required'),
	gender: z.enum(['MALE', 'FEMALE']),
	marital_status: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']),
	profile_photo_url: z.string().nullable().default(null),
	date_of_birth: z.string().min(1, 'Date of birth is required'),
	nationality: z.string().min(1, 'Nationality is required'),
	current_address: z.string().min(1, 'Current address is required'),
	id_type: z
		.enum(['DRIVER_LICENSE', 'PASSPORT', 'NATIONAL_ID', 'GHANA_CARD'])
		.nullable()
		.default(null),
	id_number: z.string().min(1, 'ID number is required'),
	id_front_url: z.string().nullable().default(null),
	id_back_url: z.string().nullable().default(null),
	emergency_contact_name: z
		.string()
		.min(1, 'Emergency contact name is required'),
	emergency_contact_phone: z
		.string()
		.min(1, 'Emergency contact phone is required'),
	relationship_to_emergency_contact: z
		.string()
		.min(1, 'Relationship is required'),
	employer_type: z.enum(['WORKER', 'STUDENT']),
	occupation: z.string().min(1, 'Occupation is required'),
	employer: z.string().min(1, 'Employer is required'),
	occupation_address: z.string().min(1, 'Occupation address is required'),
	proof_of_income_url: z.string().nullable().default(null),
})

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)

	if (clientUserProperty?.role !== 'MANAGER') {
		throw new Response(null, { status: 403, statusText: 'Unauthorized' })
	}

	return {
		origin: getDomainUrl(request),
		clientUserProperty,
		rentLoopWebsiteUrl: environmentVariables().RENTLOOP_WEBSITE_URL,
	}
}

export const handle = {
	breadcrumb: 'New Lease Application',
}

export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const clientId = safeString(authSession.get('selectedClientId'))

	const formData = await request.formData()
	const cleanedData = replaceNullUndefinedWithUndefined(
		Object.fromEntries(formData),
	)
	const result = CreateTenantApplicationSchema.safeParse(cleanedData)

	if (!result.success) {
		return {
			error: 'Invalid form data',
			fieldErrors: result.error.flatten().fieldErrors,
		}
	}

	try {
		const tenantApplication = await createTenantApplication(
			{
				...result.data,
				client_id: clientId,
			},
			{
				baseUrl,
				authToken: authSession.get('authToken'),
			},
		)

		if (!tenantApplication) {
			throw new Error('Lease application creation returned no data')
		}

		return redirect(
			`/properties/${result.data.property_id}/occupancy/applications/${tenantApplication.id}`,
		)
	} catch {
		return { error: 'Failed to create lease application' }
	}
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `New Lease Application | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default NewPropertyTenantApplicationModule
