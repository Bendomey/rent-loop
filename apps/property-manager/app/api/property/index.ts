import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

/**
 * GET all properties based on a query.
 */

const getProperties = async (
	props: FetchMultipleDataInputParams<FetchPropertyFilter>,
) => {
	try {
		const removeAllNullableValues = getQueryParams<FetchPropertyFilter>(props)
		const params = new URLSearchParams(removeAllNullableValues)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Property>>
		>(`/v1/properties?${params.toString()}`)

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
	query: FetchMultipleDataInputParams<FetchPropertyFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PROPERTIES, query],
		queryFn: () => getProperties(query),
	})

/**
 * Get property
 */
export const getProperty = async (
	id: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Property>>(
			`${apiConfig?.baseUrl}/v1/properties/${id}`,
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
	props: CreatePropertyInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Property>>(
			`${apiConfig?.baseUrl}/v1/properties`,
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
