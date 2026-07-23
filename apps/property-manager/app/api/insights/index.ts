import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient } from '~/lib/transport'

/**
 * GET the per-property breakdown backing an Insights risk-summary modal.
 */
const getRiskProperties = async (
	clientId: string,
	type: InsightsRiskType,
	propertyIds?: string[],
) => {
	try {
		const params = new URLSearchParams({ type })
		for (const id of propertyIds ?? []) params.append('property_id', id)

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
	propertyIds?: string[],
	enabled = true,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.INSIGHTS_RISK_PROPERTIES,
			clientId,
			type,
			propertyIds,
		],
		queryFn: () => getRiskProperties(clientId, type, propertyIds),
		enabled: enabled && !!clientId,
	})
