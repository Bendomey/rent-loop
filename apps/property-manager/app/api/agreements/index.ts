import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient, fetchServer } from '~/lib/transport'

const getAgreements = async (clientId: string) => {
	try {
		const response = await fetchClient<ApiResponse<Agreement[]>>(
			`/v1/admin/clients/${clientId}/agreements`,
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

export const getAgreementsForServer = async (
	clientId: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Agreement[]>>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/agreements`,
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

export const useGetAgreements = (clientId: string) =>
	useQuery({
		queryKey: [QUERY_KEYS.AGREEMENTS, clientId],
		queryFn: () => getAgreements(clientId),
		enabled: !!clientId,
	})

const acceptAgreement = async ({
	clientId,
	agreementId,
}: {
	clientId: string
	agreementId: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<object>>(
			`/v1/admin/clients/${clientId}/agreements/${agreementId}/accept`,
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

export const useAcceptAgreement = (clientId: string) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (agreementId: string) =>
			acceptAgreement({ clientId, agreementId }),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.AGREEMENTS, clientId],
			})
		},
	})
}
