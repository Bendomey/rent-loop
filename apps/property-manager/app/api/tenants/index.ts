import { useMutation } from '@tanstack/react-query'
import { fetchClient } from '~/lib/transport'

/**
 * Get Tenant by Phone
 */
const getTenantByPhone = async (phone?: string) => {
	try {
		const response = await fetchClient<ApiResponse<Tenant>>(
			`/v1/tenants/phone/${phone}`,
			{
				method: 'GET',
			},
		)
		return response.parsedBody.data
	} catch (error) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}
export const useGetTenantByPhone = () =>
	useMutation({ mutationFn: (phone?: string) => getTenantByPhone(phone) })
