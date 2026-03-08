import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient } from '~/lib/transport'

// ---------------------------------------------------------------------------
// Analytics token (signs a Cube.js JWT scoped to the authenticated client)
// ---------------------------------------------------------------------------

const getAnalyticsToken = async (): Promise<string> => {
	const response = await fetchClient<ApiResponse<{ token: string }>>(
		'/v1/admin/analytics/token',
	)
	return response.parsedBody.data.token
}

export const useGetAnalyticsToken = () =>
	useQuery({
		queryKey: [QUERY_KEYS.ANALYTICS_TOKEN],
		queryFn: getAnalyticsToken,
		// Token is valid for 1 hour; refetch at 45 min to stay ahead of expiry
		staleTime: 45 * 60 * 1000,
		retry: 1,
	})

// ---------------------------------------------------------------------------
// Cube.js REST API types and helper
// ---------------------------------------------------------------------------

export interface CubeTimeDimension {
	dimension: string
	granularity?: 'day' | 'week' | 'month' | 'quarter' | 'year'
	dateRange?: [string, string] | string
}

export interface CubeFilter {
	member: string
	operator:
		| 'equals'
		| 'notEquals'
		| 'contains'
		| 'gt'
		| 'gte'
		| 'lt'
		| 'lte'
		| 'inDateRange'
		| 'notInDateRange'
		| 'beforeDate'
		| 'afterDate'
		| 'set'
		| 'notSet'
	values?: string[]
}

export interface CubeQuery {
	measures?: string[]
	dimensions?: string[]
	timeDimensions?: CubeTimeDimension[]
	filters?: CubeFilter[]
	limit?: number
	order?: Record<string, 'asc' | 'desc'>
}

export async function cubeLoad<T = Record<string, unknown>>(
	token: string,
	query: CubeQuery,
): Promise<T[]> {
	const baseUrl = window.ENV.CUBEJS_API_URL
	const response = await fetch(`${baseUrl}/cubejs-api/v1/load`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query }),
	})
	if (!response.ok) {
		throw new Error(`Cube query failed: ${response.statusText}`)
	}
	const result = (await response.json()) as { data: T[] }
	return result.data
}

/**
 * TanStack Query wrapper around cubeLoad.
 * Only runs when `token` is available (enabled: !!token).
 */
export const useCubeQuery = <T = Record<string, unknown>>(
	token: string | undefined,
	queryKey: string[],
	query: CubeQuery,
) =>
	useQuery({
		queryKey: ['cube', ...queryKey],
		queryFn: () => cubeLoad<T>(token!, query),
		enabled: !!token,
		staleTime: 5 * 60 * 1000, // 5 min cache for analytics data
		retry: 1,
	})
