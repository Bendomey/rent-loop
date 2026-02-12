import { useMemo } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'
import { useGetPropertyUnits } from '~/api/units'
import { getPropertyUnitStatusLabel } from '~/lib/properties.utils'

interface UnitSelectProps
	extends FetchMultipleDataInputParams<FetchClientUserFilter> {
	property_id: string
	label?: string
	maxCount?: number
	value?: string
	onChange?: (value: { id: string; name: string }) => void
}

export function UnitSelect({
	property_id,
	filters,
	sorter = { sort: 'desc', sort_by: 'created_at' },
	pagination = { per: 1000 },
	populate,
	search,
	value,
	label = 'Unit',
	onChange,
}: UnitSelectProps) {
	const { data, isPending, error } = useGetPropertyUnits({
		property_id,
		filters,
		sorter,
		pagination,
		populate,
		search,
	})

	const selectOptions: Array<{
		value: string
		label: string
		isAvailable?: boolean
	}> = useMemo(() => {
		if (data && data.rows) {
			return data.rows.map((item) => ({
				value: item.id,
				label:
					item.status === 'Unit.Status.Available'
						? item.name
						: `${item.name} (${getPropertyUnitStatusLabel(item.status)})`,
				isAvailable: item.status === 'Unit.Status.Available',
			}))
		}

		if (isPending) {
			return [{ value: 'loading', label: 'Loading...' }]
		}

		if (error) {
			return [{ value: 'error', label: error ? 'Error fetching Units.' : '' }]
		}

		return []
	}, [data, isPending, error])

	return (
		<div>
			<label className="Unit mb-2 text-sm font-medium">{label}</label>

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
					<SelectValue placeholder="Select Unit..." />
				</SelectTrigger>

				<SelectContent>
					{selectOptions.map((opt) => (
						<SelectItem
							disabled={!opt.isAvailable}
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
