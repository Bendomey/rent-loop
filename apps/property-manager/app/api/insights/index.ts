import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient } from '~/lib/transport'

/**
 * GET the per-property breakdown backing an Insights risk-summary modal.
 */
const getRiskProperties = async (
	clientId: string,
	type: InsightsRiskType,
	propertyId?: string,
) => {
	try {
		const params = new URLSearchParams({ type })
		if (propertyId) params.set('property_id', propertyId)

		const response = await fetchClient<
			ApiResponse<InsightsRiskPropertiesResponse>
		>(`/v1/admin/clients/${clientId}/insights/risk-properties?${params}`)
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

export const useGetRiskProperties = (
	clientId: string,
	type: InsightsRiskType,
	propertyId?: string,
	enabled = true,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.INSIGHTS_RISK_PROPERTIES, clientId, type, propertyId],
		queryFn: () => getRiskProperties(clientId, type, propertyId),
		enabled: enabled && !!clientId,
	})
