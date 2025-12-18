import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

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
