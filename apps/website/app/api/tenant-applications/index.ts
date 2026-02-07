import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'


export interface CreatePropertyTenantApplicationInput {
	property_id: string
	desired_unit_id: string
	desired_unit?: string
	on_boarding_method: TenantApplication['on_boarding_method']
	first_name: string
	other_names: Maybe<string>
	last_name: string
	email: string
	phone: string
	gender: TenantApplication['gender']
	marital_status: TenantApplication['marital_status']
	profile_photo_url: Maybe<string>
	date_of_birth: string
	current_address: string

	// Identity
	nationality: string
	id_type: Maybe<TenantApplication['id_type']>
	id_number: string
	id_front_url: Nullable<string>
	id_back_url: Nullable<string>

	// Emergency_Contact
	emergency_contact_name: string
	emergency_contact_phone: string
	relationship_to_emergency_contact: string

	// Occupation_Details
	employment_type: TenantApplication['employment_type']
	occupation: string
	employer: string
	occupation_address: string
	proof_of_income_url: Nullable<string>

	created_by_id: ClientUser['id']
}

export const createTenantApplication = async (
	props: CreatePropertyTenantApplicationInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<TenantApplication>>(
			`${apiConfig?.baseUrl}/v1/tenant-applications`,
			{
				method: 'POST',
				body: JSON.stringify(props),
				...(apiConfig ? apiConfig : {}),
			},
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}
