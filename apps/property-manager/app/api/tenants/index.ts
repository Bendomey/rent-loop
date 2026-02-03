import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient } from '~/lib/transport'

/**
 * Get Tenant by Phone
 */
type GetTenantByPhoneOptions = Omit<
	UseQueryOptions<unknown, Error, Tenant, readonly unknown[]>,
	'queryKey' | 'queryFn'
>

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
export const useGetTenantByPhone = (
	phone?: string,
	options?: GetTenantByPhoneOptions,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PROPERTY_TENANTS, phone],
		queryFn: () => getTenantByPhone(phone),
		enabled: !!phone && (options?.enabled ?? true),
		...options,
	})
