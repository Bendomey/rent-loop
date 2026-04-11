import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all property blocks based on a query.
 */
export const getPropertyBlocks = async (
	clientId: string,
	props: FetchMultipleDataInputParams<FetchPropertyBlockFilter> & {
		property_id: string
	},
) => {
	try {
		const params = getQueryParams<FetchPropertyBlockFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<PropertyBlock>>
		>(
			`/v1/admin/clients/${clientId}/properties/${props.property_id}/blocks?${params.toString()}`,
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

export const useGetPropertyBlocks = (
	clientId: string,
	query: FetchMultipleDataInputParams<FetchPropertyBlockFilter> & {
		property_id: string
	},
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PROPERTY_BLOCKS, clientId, query],
		queryFn: () => getPropertyBlocks(clientId, query),
		enabled: !!clientId,
	})

export interface CreatePropertyBlockInput {
	property_id: string
	name: string
	description: Maybe<string>
	images: Maybe<string[]>
	status: PropertyBlock['status']
}

export const createPropertyBlock = async (
	clientId: string,
	props: CreatePropertyBlockInput,
) => {
	try {
		const response = await fetchClient<ApiResponse<PropertyBlock>>(
			`/v1/admin/clients/${clientId}/properties/${props.property_id}/blocks`,
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

export const useCreatePropertyBlock = (clientId: string) =>
	useMutation({
		mutationFn: (props: CreatePropertyBlockInput) =>
			createPropertyBlock(clientId, props),
	})

/**
 * Get single property block by ID
 */

const getPropertyBlock = async (
	clientId: string,
	props: { property_id: string; id: string },
) => {
	try {
		const response = await fetchClient<ApiResponse<PropertyBlock>>(
			`/v1/admin/clients/${clientId}/properties/${props.property_id}/blocks/${props.id}`,
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

export const useGetPropertyBlock = (
	clientId: string,
	props: {
		property_id: string
		id: string
	},
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PROPERTY_BLOCKS, clientId, props],
		queryFn: () => getPropertyBlock(clientId, props),
		enabled: !!clientId,
	})

interface UpdatePropertyBlockProps {
	id: string
	data: Partial<CreatePropertyBlockInput>
}

/**
 * Update Property Block
 */

const updatePropertyBlock = async (
	clientId: string,
	props: UpdatePropertyBlockProps,
) => {
	try {
		await fetchClient<PropertyBlock>(
			`/v1/admin/clients/${clientId}/properties/${props.data.property_id}/blocks/${props.id}`,
			{
				method: 'PATCH',
				body: JSON.stringify(props.data),
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

export const useUpdatePropertyBlock = (clientId: string) =>
	useMutation({
		mutationFn: (props: UpdatePropertyBlockProps) =>
			updatePropertyBlock(clientId, props),
	})

/**
 * Delete property block
 */
const deletePropertyBlock = async (
	clientId: string,
	props: {
		property_id: string
		block_id: string
	},
) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${clientId}/properties/${props.property_id}/blocks/${props.block_id}`,
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

export const useDeletePropertyBlock = (clientId: string) =>
	useMutation({
		mutationFn: (props: { property_id: string; block_id: string }) =>
			deletePropertyBlock(clientId, props),
	})
