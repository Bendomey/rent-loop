import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

export const getDocuments = async (
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
