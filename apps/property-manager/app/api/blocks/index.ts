import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all property blocks based on a query.
 */

const getPropertyBlocks = async (
	props: FetchMultipleDataInputParams<FetchPropertyBlockFilter> & {
		property_id: string
	},
) => {
	try {
		const removeAllNullableValues =
			getQueryParams<FetchPropertyBlockFilter>(props)
		const params = new URLSearchParams(removeAllNullableValues)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<PropertyBlock>>
		>(`/v1/properties/${props.property_id}/blocksd?${params.toString()}`)

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

export const useGetPropertyBlocks = (
	query: FetchMultipleDataInputParams<FetchPropertyBlockFilter> & {
		property_id: string
	},
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PROPERTY_BLOCKS, query],
		queryFn: () => getPropertyBlocks(query),
	})

export interface CreatePropertyBlockInput {
	property_id: string
	name: string
	description: Maybe<string>
	images: Maybe<string[]>
	status: PropertyBlock['status']
}

export const createPropertyBlock = async (props: CreatePropertyBlockInput) => {
	try {
		const response = await fetchClient<ApiResponse<PropertyBlock>>(
			`/v1/properties/${props.property_id}/blocks`,
			{
				method: 'POST',
				body: JSON.stringify(props),
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

export const useCreatePropertyBlock = () =>
	useMutation({ mutationFn: createPropertyBlock })
