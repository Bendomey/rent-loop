import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

const getDocuments = async (
	props: FetchMultipleDataInputParams<FetchRentloopDocumentFilter>,
) => {
	try {
		const removeAllNullableValues =
			getQueryParams<FetchRentloopDocumentFilter>(props)
		const params = new URLSearchParams(removeAllNullableValues)
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

const createDocument = async (params: CreateDocumentInputParams) => {
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
