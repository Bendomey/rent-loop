import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

/**
 * GET all properties based on a query.
 */
const getProperties = async (
	clientId: string,
	props: FetchMultipleDataInputParams<FetchPropertyFilter>,
) => {
	try {
		const params = getQueryParams<FetchPropertyFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Property>>
		>(`/v1/admin/clients/${clientId}/properties?${params.toString()}`)

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

export const useGetProperties = (
	clientId: string,
	query: FetchMultipleDataInputParams<FetchPropertyFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PROPERTIES, clientId, query],
		queryFn: () => getProperties(clientId, query),
		enabled: !!clientId,
	})

export const getPropertiesForServer = async (
	clientId: string,
	props: FetchMultipleDataInputParams<FetchPropertyFilter>,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const params = getQueryParams<FetchPropertyFilter>(props)
		const response = await fetchServer<
			ApiResponse<FetchMultipleDataResponse<Property>>
		>(
			`${apiConfig?.baseUrl}/v1/admin/clients/${clientId}/properties?${params.toString()}`,
			{
				method: 'GET',
				...apiConfig,
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
 * Get property
 */
export const getProperty = async (
	clientId: string,
	id: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Property>>(
			`${apiConfig?.baseUrl}/v1/admin/clients/${clientId}/properties/${id}`,
			{
				method: 'GET',
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

export const getPropertyBySlug = async (
	clientId: string,
	slug: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Property>>(
			`${apiConfig?.baseUrl}/v1/admin/clients/${clientId}/properties/slug/${slug}`,
			{
				method: 'GET',
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

export interface CreatePropertyInput {
	address: string
	city: string
	country: string
	description: Maybe<string>
	gps_address: Maybe<string>
	images: Maybe<string[]>
	latitude: number
	longitude: number
	name: string
	region: string
	status: Property['status']
	tags: string[]
	type: Property['type']
}

export const createProperty = async (
	clientId: string,
	props: CreatePropertyInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Property>>(
			`${apiConfig?.baseUrl}/v1/admin/clients/${clientId}/properties`,
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
 * Delete property
 */
const deleteProperty = async ({
	clientId,
	id,
}: {
	clientId: string
	id: string
}) => {
	try {
		await fetchClient(`/v1/admin/clients/${clientId}/properties/${id}`, {
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

export const useDeleteProperty = () =>
	useMutation({
		mutationFn: deleteProperty,
	})

export const getClientUserProperties = async (
	clientId: string,
	props: FetchMultipleDataInputParams<FetchClientUserPropertyFilter>,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const params = getQueryParams<FetchClientUserPropertyFilter>(props)
		const response = await fetchServer<
			ApiResponse<FetchMultipleDataResponse<ClientUserProperty>>
		>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/properties/me?${params.toString()}`,
			{
				method: 'GET',
				authToken: apiConfig.authToken,
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

const getClientUserPropertiesForClient = async (
	clientId: string,
	props: FetchMultipleDataInputParams<FetchClientUserPropertyFilter>,
) => {
	try {
		const params = getQueryParams<FetchClientUserPropertyFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<ClientUserProperty>>
		>(`/v1/admin/clients/${clientId}/properties/me?${params.toString()}`, {
			method: 'GET',
		})

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

export const useGetMyProperties = (
	clientId: string,
	query: FetchMultipleDataInputParams<FetchClientUserPropertyFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.CURRENT_USER, QUERY_KEYS.PROPERTIES, clientId, query],
		queryFn: () => getClientUserPropertiesForClient(clientId, query),
		enabled: !!clientId,
	})
