import { useMemo } from 'react'
import { MultiSelect } from '../multi-select'
import { useGetClientUsers } from '~/api/client-users'

interface MembersSelectProps
	extends FetchMultipleDataInputParams<FetchClientUserFilter> {
	label?: string
	maxCount?: number
	onChange?: (values: string[]) => void
}

export function MembersSelect({
	filters,
	sorter = { sort: 'desc', sort_by: 'created_at' },
	pagination = { per: 1000 },
	populate,
	search,
	label = 'Members',
	maxCount = 2,
	onChange,
}: MembersSelectProps) {
	const { data, isPending, error } = useGetClientUsers({
		filters,
		sorter,
		pagination,
		populate,
		search,
	})

	const selectOptions: Array<{ value: string; label: string }> = useMemo(() => {
		if (data && data.rows) {
			return data.rows.map((item) => ({ value: item.id, label: item.name }))
		}

		if (isPending) {
			return [{ value: 'loading', label: 'Loading...' }]
		}

		if (error) {
			return [{ value: 'error', label: error ? 'Error fetching members.' : '' }]
		}

		return []
	}, [data, isPending, error])

	return (
		<div>
			<label className="mb-2 block text-sm font-medium">{label}</label>
			<MultiSelect
				disabled={isPending}
				options={selectOptions}
				placeholder="Select members..."
				className="w-full sm:w-auto"
				maxCount={maxCount}
				onValueChange={onChange ?? (() => {})}
			/>
		</div>
	)
}
