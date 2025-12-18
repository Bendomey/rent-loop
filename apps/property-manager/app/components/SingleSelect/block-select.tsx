import { useMemo } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'
import { useGetPropertyBlocks } from '~/api/blocks'

interface BlockSelectProps
	extends FetchMultipleDataInputParams<FetchClientUserFilter> {
	property_id: string
	label?: string
	maxCount?: number
	value?: string
	onChange?: (value: { id: string; name: string }) => void
}

export function BlockSelect({
	property_id,
	filters,
	sorter = { sort: 'desc', sort_by: 'created_at' },
	pagination = { per: 1000 },
	populate,
	search,
	value,
	label = 'Block',
	onChange,
}: BlockSelectProps) {
	const { data, isPending, error } = useGetPropertyBlocks({
		property_id,
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
			return [{ value: 'error', label: error ? 'Error fetching blocks.' : '' }]
		}

		return []
	}, [data, isPending, error])

	return (
		<div>
			<label className="mb-2 block text-sm font-medium">{label}</label>

			<Select
				disabled={isPending}
				value={value}
				onValueChange={(value) => {
					const selected = selectOptions.find((opt) => opt.value === value)

					if (selected) {
						onChange?.({
							id: selected.value,
							name: selected.label,
						})
					}
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select block..." />
				</SelectTrigger>

				<SelectContent>
					{selectOptions.map((opt) => (
						<SelectItem
							key={opt.value}
							value={opt.value}
							className="data-[state=checked]:bg-rose-50 data-[state=checked]:ring-1 data-[state=checked]:ring-rose-600 data-[state=checked]:ring-offset-2"
						>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}
