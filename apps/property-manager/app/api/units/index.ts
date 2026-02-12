import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

/**
 * GET all property apartments/units based on a query.
 */

export const getPropertyUnits = async (
	props: FetchMultipleDataInputParams<FetchPropertyUnitFilter> & {
		property_id: string
	},
) => {
	try {
		const params = getQueryParams<FetchPropertyUnitFilter>(props)
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
	features: StringRecord
	max_occupants_allowed: number
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
			`${apiConfig?.baseUrl}/v1/properties/${props.property_id}/blocks/${props.property_block_id}/units`,
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
			console.log(response)
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}

/**
 * Delete property unit
 */
const deletePropertyUnit = async (props: {
	property_id: string
	unit_id: string
}) => {
	try {
		await fetchClient(
			`/v1/properties/${props.property_id}/units/${props.unit_id}`,
			{
				method: 'DELETE',
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

export const useDeletePropertyUnit = () =>
	useMutation({
		mutationFn: deletePropertyUnit,
	})
