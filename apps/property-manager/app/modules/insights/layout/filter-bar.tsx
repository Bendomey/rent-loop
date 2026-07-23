import { useMemo } from 'react'
import { useInsightsFilters } from '../use-insights-filters'
import { useGetClientUserProperties } from '~/api/client-user-properties'
import { MultiSelect } from '~/components/multi-select'
import { DateRangePicker } from '~/components/ui/date-ranger-picker'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

export function InsightsFilterBar() {
	const { from, to, propertyIds, compare, setFilters } = useInsightsFilters()
	const { clientUser } = useClient()

	const { data: propertiesData } = useGetClientUserProperties(
		safeString(clientUser?.client_id),
		{
			pagination: { page: 1, per: 50 },
			sorter: {},
			search: {},
			populate: ['Property'],
			filters: { client_user_id: clientUser?.id },
		},
	)

	const propertyOptions = useMemo(
		() =>
			(propertiesData?.rows ?? []).flatMap((row) =>
				row.property
					? [{ value: row.property.id, label: row.property.name }]
					: [],
			),
		[propertiesData],
	)

	return (
		<div className="flex flex-col gap-3 md:flex-row md:items-center">
			<DateRangePicker
				key={`${from}:${to}`}
				initialDateFrom={from}
				initialDateTo={to}
				showCompare={false}
				align="start"
				onUpdate={({ range }) => {
					setFilters({
						from: localizedDayjs(range.from).format('YYYY-MM-DD'),
						to: localizedDayjs(range.to ?? range.from).format('YYYY-MM-DD'),
					})
				}}
			/>
			<MultiSelect
				options={propertyOptions}
				defaultValue={propertyIds}
				onValueChange={(values) => setFilters({ propertyIds: values })}
				placeholder="All properties"
				maxCount={1}
				minWidth="200px"
				maxWidth="16rem"
			/>
			<div className="flex items-center gap-2">
				<Switch
					id="insights-compare"
					checked={compare}
					onCheckedChange={(checked) => setFilters({ compare: checked })}
				/>
				<Label htmlFor="insights-compare">Compare previous period</Label>
			</div>
		</div>
	)
}
