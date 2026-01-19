import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

/**
 * GET all tenant applications based on a query.
 */

const getPropertyTenantApplications = async (
	props: FetchMultipleDataInputParams<FetchTenantApplicationFilter>,
) => {
	try {
		const removeAllNullableValues =
			getQueryParams<FetchTenantApplicationFilter>(props)
		const params = new URLSearchParams(removeAllNullableValues)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<TenantApplication>>
		>(`/v1/tenant-applications?${params.toString()}`)

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

export const useGetPropertyTenantApplications = (
	query: FetchMultipleDataInputParams<FetchTenantApplicationFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PROPERTY_TENANT_APPLICATIONS, query],
		queryFn: () => getPropertyTenantApplications(query),
	})

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

/**
 * Invite tenant to a property.
 */
const inviteTenantToProperty = async (props: {
	unit_id: string
	email: Maybe<string>
	phone: Maybe<string>
}) => {
	try {
		await fetchClient(`/v1/tenant-applications/invite`, {
			method: 'POST',
			body: JSON.stringify(props),
		})
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

export const useInviteTenateToProperty = () =>
	useMutation({
		mutationFn: inviteTenantToProperty,
	})

interface cancelTenantApplicationProps {
	id: string
	reason: string
}

/**
 * Cancel Tenant Application
 */
const cancelTenantApplication = async ({
	id,
	reason,
}: cancelTenantApplicationProps) => {
	try {
		const response = await fetchClient<ApiResponse<TenantApplication>>(
			`/v1/tenant-applications/${id}/cancel`,
			{
				method: 'PATCH',
				body: JSON.stringify({ reason }),
			},
		)
		return response.parsedBody.data
	} catch (error) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}
export const useCancelTenantApplication = () =>
	useMutation({ mutationFn: cancelTenantApplication })

/**
 * approve tenant application
 */

const approveTenantApplication = async (id: string) => {
	try {
		await fetchClient<boolean>(`/v1/tenant-applications/${id}/approve`, {
			method: 'PATCH',
		})
	} catch (error) {
		if (error instanceof Error) {
			throw error
		}

		// Error from server.
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.message)
		}
	}
}

export const useApproveTenantApplication = () =>
	useMutation({ mutationFn: approveTenantApplication })

/**
 * Delete Tenant Application
 */
const deleteTenantApplication = async (props: { id: string }) => {
	try {
		await fetchClient(`/v1/tenant-applications/${props.id}`, {
			method: 'DELETE',
		})
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

export const useDeleteTenantApplication = () =>
	useMutation({
		mutationFn: deleteTenantApplication,
	})
