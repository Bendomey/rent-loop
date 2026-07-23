import { useMemo } from 'react'
import { useInsightsFilters } from '../use-insights-filters'
import { useGetClientUserProperties } from '~/api/client-user-properties'
import { DateRangePicker } from '~/components/ui/date-ranger-picker'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

const ALL_PROPERTIES = 'all'

export function InsightsFilterBar() {
	const { from, to, propertyId, compare, setFilters } = useInsightsFilters()
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

	const properties = useMemo(
		() =>
			(propertiesData?.rows ?? []).flatMap((row) =>
				row.property ? [{ id: row.property.id, name: row.property.name }] : [],
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
			<Select
				value={propertyId ?? ALL_PROPERTIES}
				onValueChange={(value) =>
					setFilters({
						propertyId: value === ALL_PROPERTIES ? undefined : value,
					})
				}
			>
				<SelectTrigger className="w-full md:w-56">
					<SelectValue placeholder="All properties" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_PROPERTIES}>All properties</SelectItem>
					{properties.map((property) => (
						<SelectItem key={property.id} value={property.id}>
							{property.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
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
