import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

/**
 * GET all property apartments/units based on a query.
 */

const getPropertyUnits = async (
	props: FetchMultipleDataInputParams<FetchPropertyUnitFilter> & {
		property_id: string
	},
) => {
	try {
		const removeAllNullableValues =
			getQueryParams<FetchPropertyUnitFilter>(props)
		const params = new URLSearchParams(removeAllNullableValues)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<PropertyUnit>>
		>(`/v1/properties/${props.property_id}/units?${params.toString()}`)

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

export const useGetPropertyUnits = (
	query: FetchMultipleDataInputParams<FetchPropertyUnitFilter> & {
		property_id: string
	},
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PROPERTY_UNITS, query],
		queryFn: () => getPropertyUnits(query),
	})

export interface CreatePropertyUnitInput {
	property_id: string
	property_block_id: string
	block?: string
	type: PropertyUnit['type']
	status: PropertyUnit['status']
	name: string
	description: Maybe<string>
	images: Maybe<string[]>
	tags: string[]
	area: Maybe<number>
	rent_fee: number
	rent_fee_currency: string
	payment_frequency: PropertyUnit['payment_frequency']
}

export const createPropertyUnit = async (
	props: CreatePropertyUnitInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<PropertyUnit>>(
			`${apiConfig?.baseUrl}/v1/properties/${props.property_id}/units`,
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
