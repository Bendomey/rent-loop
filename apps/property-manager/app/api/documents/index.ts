import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

const getDocuments = async (
	clientId: string,
	props: FetchMultipleDataInputParams<FetchRentloopDocumentFilter>,
) => {
	try {
		const params = getQueryParams<FetchRentloopDocumentFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<RentloopDocument>>
		>(`/v1/admin/clients/${clientId}/documents?${params.toString()}`)

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
	clientId: string,
	id: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<RentloopDocument>>(
			`${apiConfig?.baseUrl}/v1/admin/clients/${clientId}/documents/${id}`,
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
	clientId: string,
	query: FetchMultipleDataInputParams<FetchRentloopDocumentFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.DOCUMENTS, clientId, query],
		queryFn: () => getDocuments(clientId, query),
		enabled: !!clientId,
	})

interface CreateDocumentInputParams {
	content: string
	property_id?: string
	size: number
	tags: Array<string>
	title: string
	type: 'TEMPLATE' | 'DOCUMENT'
}

export const createDocumentSSR = async (
	clientId: string,
	params: CreateDocumentInputParams,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<RentloopDocument>>(
			`${apiConfig?.baseUrl}/v1/admin/clients/${clientId}/documents`,
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

export const createDocument = async (
	clientId: string,
	params: CreateDocumentInputParams,
) => {
	try {
		const response = await fetchClient<ApiResponse<RentloopDocument>>(
			`/v1/admin/clients/${clientId}/documents`,
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

export const useCreateDocument = (clientId: string) =>
	useMutation({
		mutationFn: (params: CreateDocumentInputParams) =>
			createDocument(clientId, params),
	})

interface AdminUpdateDocumentInputParams {
	clientId: string
	id: string
	content?: string
	title?: string
	size?: number
	tags?: Array<string>
	property_id?: string
}

const adminUpdateDocument = async ({
	clientId,
	id,
	...data
}: AdminUpdateDocumentInputParams) => {
	try {
		const response = await fetchClient<ApiResponse<RentloopDocument>>(
			`/v1/admin/clients/${clientId}/documents/${id}`,
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

		if (error instanceof Error) {
			throw error
		}
	}
}

export const useAdminUpdateDocument = () =>
	useMutation({
		mutationFn: adminUpdateDocument,
	})

interface UpdateDocumentInputParams {
	id: string
	content: string
}

const updateDocument = async ({ id, ...data }: UpdateDocumentInputParams) => {
	try {
		const response = await fetchClient<ApiResponse<RentloopDocument>>(
			`/v1/documents/${id}`,
			{
				method: 'PATCH',
				body: JSON.stringify(data),
				isUnAuthorizedRequest: true,
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

export const useUpdateDocument = () =>
	useMutation({
		mutationFn: updateDocument,
	})

const deleteDocument = async ({
	clientId,
	id,
}: {
	clientId: string
	id: string
}) => {
	try {
		await fetchClient(`/v1/admin/clients/${clientId}/documents/${id}`, {
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
