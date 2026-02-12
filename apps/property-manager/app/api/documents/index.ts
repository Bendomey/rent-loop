import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

const getDocuments = async (
	props: FetchMultipleDataInputParams<FetchRentloopDocumentFilter>,
) => {
	try {
		const params = getQueryParams<FetchRentloopDocumentFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<RentloopDocument>>
		>(`/v1/documents?${params.toString()}`)

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

export const getDocument = async (
	id: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<RentloopDocument>>(
			`${apiConfig?.baseUrl}/v1/documents/${id}`,
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

export const useGetDocuments = (
	query: FetchMultipleDataInputParams<FetchRentloopDocumentFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.DOCUMENTS, query],
		queryFn: () => getDocuments(query),
	})

interface CreateDocumentInputParams {
	content: string
	property_id?: string
	size: number
	tags: Array<string>
	title: string
}

export const createDocumentSSR = async (
	params: CreateDocumentInputParams,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<RentloopDocument>>(
			`${apiConfig?.baseUrl}/v1/documents`,
			{
				method: 'POST',
				body: JSON.stringify(params),
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

export const createDocument = async (params: CreateDocumentInputParams) => {
	try {
		const response = await fetchClient<ApiResponse<RentloopDocument>>(
			'/v1/documents',
			{
				method: 'POST',
				body: JSON.stringify(params),
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

export const useCreateDocument = () =>
	useMutation({
		mutationFn: createDocument,
	})

const deleteDocument = async (id: string) => {
	try {
		await fetchClient(`/v1/documents/${id}`, {
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

export const useDeleteDocument = () =>
	useMutation({
		mutationFn: deleteDocument,
	})
