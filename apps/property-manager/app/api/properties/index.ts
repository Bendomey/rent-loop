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
	modes: Array<'LEASE' | 'BOOKING'>
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

export interface UpdatePropertyInput {
	propertyId: string
	data: Partial<CreatePropertyInput>
}

const updateProperty = async (
	clientId: string,
	{ propertyId, data }: UpdatePropertyInput,
) => {
	try {
		const response = await fetchClient<ApiResponse<Property>>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}`,
			{
				method: 'PATCH',
				body: JSON.stringify(data),
			},
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useUpdateProperty = (clientId: string) =>
	useMutation({
		mutationFn: (data: UpdatePropertyInput) => updateProperty(clientId, data),
	})

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

/**
 * Preview what deleting a property would archive, or why it's blocked.
 */
const getPropertyDeletionPreview = async (clientId: string, id: string) => {
	try {
		const response = await fetchClient<
			ApiResponse<PropertyDeletionEligibility>
		>(`/v1/admin/clients/${clientId}/properties/${id}/deletion:preview`)
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

export const useGetPropertyDeletionPreview = (
	clientId: string,
	propertyId: string,
	enabled: boolean,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PROPERTIES, clientId, propertyId, 'deletion-preview'],
		queryFn: () => getPropertyDeletionPreview(clientId, propertyId),
		enabled: enabled && !!clientId && !!propertyId,
	})

/**
 * Preview what restoring an archived property would bring back.
 */
const getPropertyRestorePreview = async (clientId: string, id: string) => {
	try {
		const response = await fetchClient<ApiResponse<PropertyRestorePreview>>(
			`/v1/admin/clients/${clientId}/properties/${id}/restore:preview`,
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

export const useGetPropertyRestorePreview = (
	clientId: string,
	propertyId: string,
	enabled: boolean,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PROPERTIES, clientId, propertyId, 'restore-preview'],
		queryFn: () => getPropertyRestorePreview(clientId, propertyId),
		enabled: enabled && !!clientId && !!propertyId,
	})

/**
 * Restore an archived property.
 */
const restoreProperty = async ({
	clientId,
	id,
}: {
	clientId: string
	id: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${clientId}/properties/${id}:restore`,
			{
				method: 'POST',
			},
		)
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

export const useRestoreProperty = () =>
	useMutation({
		mutationFn: restoreProperty,
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
