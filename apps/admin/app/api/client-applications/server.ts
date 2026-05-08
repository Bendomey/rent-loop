import { fetchServer } from '~/lib/transport'

export const getClientApplicationByIdForServer = async (
	id: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<ClientApplication>>(
			`${apiConfig.baseUrl}/v1/admin/client-applications/${id}`,
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

export interface CreateClientApplicationInput {
	name: string
	type: ClientApplication['type']
	sub_type: ClientApplication['sub_type']
	contact_name: string
	contact_email: string
	contact_phone_number: string
	address: string
	city: string
	region: string
	country: string
	latitude: number
	longitude: number
	support_email: string
	support_phone: string
	description?: string
	website_url?: string
	registration_number?: string
	date_of_birth?: string
}

export const createClientApplicationForServer = async (
	data: CreateClientApplicationInput,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<ClientApplication>>(
			`${apiConfig.baseUrl}/v1/admin/clients/apply`,
			{
				method: 'POST',
				body: JSON.stringify(data),
				...apiConfig,
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
