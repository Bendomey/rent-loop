import { useQuery } from '@tanstack/react-query'
import { fetchClient, fetchServer } from '~/lib/transport'

export const CURRENT_USER_QUERY_KEY = ['current-user']

export interface LoginInput {
	email: string
	password: string
}

interface LoginResponse {
	user: Admin
	token: string
}

export const login = async (
	props: LoginInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<LoginResponse>>(
			`${apiConfig?.baseUrl}/v1/admin/admins/login`,
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
		if (error instanceof Error) throw error
	}
}

export const getCurrentUser = async (apiConfig?: ApiConfigForServerConfig) => {
	try {
		const response = await fetchServer<ApiResponse<Admin>>(
			`${apiConfig?.baseUrl}/v1/admin/admins/me`,
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
		if (error instanceof Error) throw error
	}
}

const getCurrentUserClient = async () => {
	const response = await fetchClient<ApiResponse<Admin>>(
		`/v1/admin/admins/me`,
		{
			method: 'GET',
		},
	)
	return response.parsedBody.data
}

export const useGetCurrentUser = (initialData?: Admin) =>
	useQuery({
		queryKey: CURRENT_USER_QUERY_KEY,
		queryFn: getCurrentUserClient,
		initialData,
	})
