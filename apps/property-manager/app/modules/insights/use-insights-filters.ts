import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { CubeFilter, CubeTimeDimension } from '~/api/analytics'
import { localizedDayjs } from '~/lib/date'

const DATE_FORMAT = 'YYYY-MM-DD'

export interface InsightsFilters {
	from: string
	to: string
	propertyId?: string
	compare: boolean
}

/**
 * Shared filter state for all /insights pages, backed by URL search params
 * (?from=&to=&property=&compare=1) so filters persist across insights pages,
 * survive refresh, and are shareable. Defaults: last 12 months, all
 * properties, compare off.
 */
export function useInsightsFilters() {
	const [searchParams, setSearchParams] = useSearchParams()

	const from =
		searchParams.get('from') ??
		localizedDayjs().subtract(12, 'month').format(DATE_FORMAT)
	const to = searchParams.get('to') ?? localizedDayjs().format(DATE_FORMAT)
	const propertyId = searchParams.get('property') ?? undefined
	const compare = searchParams.get('compare') === '1'

	const setFilters = useCallback(
		(updates: Partial<InsightsFilters>) => {
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev)
					if (updates.from !== undefined) next.set('from', updates.from)
					if (updates.to !== undefined) next.set('to', updates.to)
					if ('propertyId' in updates) {
						if (updates.propertyId) next.set('property', updates.propertyId)
						else next.delete('property')
					}
					if (updates.compare !== undefined) {
						if (updates.compare) next.set('compare', '1')
						else next.delete('compare')
					}
					return next
				},
				{ preventScrollReset: true },
			)
		},
		[setSearchParams],
	)

	// Equal-length period ending the day before `from`, for compare mode.
	const previousRange = useMemo((): [string, string] => {
		const fromDate = localizedDayjs(from)
		const days = localizedDayjs(to).diff(fromDate, 'day')
		return [
			fromDate.subtract(days + 1, 'day').format(DATE_FORMAT),
			fromDate.subtract(1, 'day').format(DATE_FORMAT),
		]
	}, [from, to])

	const timeDimension = useCallback(
		(
			dimension: string,
			granularity?: CubeTimeDimension['granularity'],
		): CubeTimeDimension => ({
			dimension,
			...(granularity ? { granularity } : {}),
			dateRange: [from, to] as [string, string],
		}),
		[from, to],
	)

	const propertyFilter = useCallback(
		(member: string): CubeFilter[] =>
			propertyId ? [{ member, operator: 'equals', values: [propertyId] }] : [],
		[propertyId],
	)

	return {
		from,
		to,
		propertyId,
		compare,
		setFilters,
		previousRange,
		timeDimension,
		propertyFilter,
	}
}
