import { fetchServer } from '~/lib/transport'

export const getAdminByIdForServer = async (
	id: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Admin>>(
			`${apiConfig.baseUrl}/v1/admin/admins/${id}`,
			{ ...apiConfig },
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

export interface CreateAdminInput {
	name: string
	email: string
}
export const createAdminForServer = async (
	props: CreateAdminInput,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Admin>>(
			`${apiConfig.baseUrl}/v1/admin/admins`,
			{
				method: 'POST',
				body: JSON.stringify(props),
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
