import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient, fetchServer } from '~/lib/transport'

const getAgreements = async () => {
	try {
		const response =
			await fetchClient<ApiResponse<Agreement[]>>(`/v1/admin/agreements`)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const getAgreementsForServer = async (
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Agreement[]>>(
			`${apiConfig.baseUrl}/v1/admin/agreements`,
			apiConfig,
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useGetAgreements = () =>
	useQuery({
		queryKey: [QUERY_KEYS.AGREEMENTS],
		queryFn: getAgreements,
	})

const acceptAgreement = async (agreementId: string) => {
	try {
		const response = await fetchClient<ApiResponse<object>>(
			`/v1/admin/agreements/${agreementId}/accept`,
			{ method: 'POST' },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useAcceptAgreement = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: acceptAgreement,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AGREEMENTS] })
		},
	})
}
