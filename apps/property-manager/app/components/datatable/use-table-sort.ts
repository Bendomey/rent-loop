import { useMemo } from 'react'
import { useSearchParams } from 'react-router'

export interface TableSorter {
	sort_by: string
	sort: 'asc' | 'desc'
}

/**
 * Reads the sort the table header wrote into the URL and hands it back in the
 * shape the API client's `sorter` expects.
 *
 * `allowedFields` is a whitelist, and it is load-bearing: `sort_by` reaches the
 * backend's ORDER BY clause, so a value straight off the URL must never be
 * forwarded. Pass the same field names the columns declare as `meta.sortKey`;
 * anything else falls back to `fallback`.
 */
export function useDataTableSort(
	allowedFields: string[],
	fallback: TableSorter = { sort_by: 'created_at', sort: 'desc' },
): TableSorter {
	const [searchParams] = useSearchParams()
	const sortBy = searchParams.get('sort_by')
	const sort = searchParams.get('sort')

	return useMemo(() => {
		if (!sortBy || !allowedFields.includes(sortBy)) return fallback
		return { sort_by: sortBy, sort: sort === 'asc' ? 'asc' : 'desc' }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [allowedFields.join(','), fallback.sort_by, fallback.sort, sortBy, sort])
}
