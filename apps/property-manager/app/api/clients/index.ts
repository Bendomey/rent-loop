import { useMutation } from '@tanstack/react-query'
import { fetchClient } from '~/lib/transport'

export interface UpdateClientInput {
	clientId: string
	type?: Client['type']
	sub_type?: Client['sub_type']
	name?: string
	description?: string | null
	registration_number?: string | null
	website_url?: string | null
	support_phone?: string | null
	support_email?: string | null
	address?: string
	country?: string
	region?: string
	city?: string
	latitude?: number
	longitude?: number
}

const updateClient = async ({ clientId, ...body }: UpdateClientInput) => {
	try {
		const response = await fetchClient<ApiResponse<Client>>(
			`/v1/admin/clients/${clientId}`,
			{
				method: 'PATCH',
				body: JSON.stringify(body),
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

export const useUpdateClient = () => useMutation({ mutationFn: updateClient })
