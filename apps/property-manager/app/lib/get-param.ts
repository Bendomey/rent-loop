import { cleanParams, type ObjectT } from './remove-nulls'

export const getQueryParams = <FilterT>(
	props: FetchMultipleDataInputParams<FilterT>,
) => {
	const filters: ObjectT = props.filters ?? {}

	const baseParams = cleanParams({
		page_size: props.pagination ? props.pagination.per : undefined,
		page: props.pagination ? props.pagination.page : undefined,
		query: props.search?.query,
		search_fields: props.search?.fields
			? props.search.fields.join(',')
			: undefined,
		...(props.sorter ?? {}),
		populate: props.populate ? props.populate.join(',') : undefined,
	})

	const params = new URLSearchParams(baseParams)

	for (const [key, value] of Object.entries(filters)) {
		if (value === null || value === undefined) continue

		if (Array.isArray(value)) {
			for (const item of value) {
				params.append(key, item)
			}
		} else {
			params.set(key, String(value))
		}
	}

	return params
}
