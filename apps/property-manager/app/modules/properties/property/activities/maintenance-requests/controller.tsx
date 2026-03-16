import { ToggleLeft } from 'lucide-react'
import { getClientUserProperties } from '~/api/client-user-properties'
import { getPropertyUnits } from '~/api/units'
import { FilterSet } from '~/components/filter-set'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { useProperty } from '~/providers/property-provider'

export function PropertyActivitiesMaintenanceRequestsController() {
	const { clientUserProperty } = useProperty()
	const propertyId = clientUserProperty?.property_id ?? ''
	const isMultiUnit = clientUserProperty?.property?.type === 'MULTI'

	const filters: Array<Filter> = [
		{
			id: 1,
			type: 'selector',
			selectType: 'single',
			label: 'Priority',
			value: {
				options: [
					{ label: 'Low', value: 'LOW' },
					{ label: 'Medium', value: 'MEDIUM' },
					{ label: 'High', value: 'HIGH' },
					{ label: 'Emergency', value: 'EMERGENCY' },
				],
				urlParam: 'priority',
				defaultValues: [],
			},
			Icon: ToggleLeft,
		},
		{
			id: 2,
			type: 'selector',
			selectType: 'single',
			label: 'Category',
			value: {
				options: [
					{ label: 'Plumbing', value: 'PLUMBING' },
					{ label: 'Electrical', value: 'ELECTRICAL' },
					{ label: 'HVAC', value: 'HVAC' },
					{ label: 'Other', value: 'OTHER' },
				],
				urlParam: 'category',
				defaultValues: [],
			},
			Icon: ToggleLeft,
		},
		{
			id: 3,
			type: 'selector',
			selectType: 'single',
			label: 'Assigned Worker',
			value: {
				onSearch: async ({ ids }) => {
					if (!propertyId) return []
					const data = await getClientUserProperties({
						filters: {
							property_id: propertyId,
							ids: ids?.map((id) => id.toString()),
						},
						pagination: {
							page: PAGINATION_DEFAULTS.PAGE,
							per: PAGINATION_DEFAULTS.PER_PAGE,
						},
						populate: ['ClientUser'],
					})
					return (
						data?.rows.map((cup) => ({
							label: cup.client_user?.name ?? cup.client_user_id,
							value: cup.client_user_id,
						})) ?? []
					)
				},
				urlParam: 'assigned_worker',
				defaultValues: [],
			},
			Icon: ToggleLeft,
		},
		{
			id: 4,
			type: 'selector',
			selectType: 'single',
			label: 'Assigned Manager',
			value: {
				onSearch: async ({ ids }) => {
					if (!propertyId) return []
					const data = await getClientUserProperties({
						filters: {
							property_id: propertyId,
							ids: ids?.map((id) => id.toString()),
						},
						pagination: {
							page: PAGINATION_DEFAULTS.PAGE,
							per: PAGINATION_DEFAULTS.PER_PAGE,
						},
						populate: ['ClientUser'],
					})
					return (
						data?.rows.map((cup) => ({
							label: cup.client_user?.name ?? cup.client_user_id,
							value: cup.client_user_id,
						})) ?? []
					)
				},
				urlParam: 'assigned_manager',
				defaultValues: [],
			},
			Icon: ToggleLeft,
		},
		...(isMultiUnit
			? ([
					{
						id: 5,
						type: 'selector',
						selectType: 'single',
						label: 'Unit',
						value: {
							onSearch: async ({ ids }) => {
								if (!propertyId) return []
								const data = await getPropertyUnits({
									property_id: propertyId,
									filters: {
										ids: ids?.map((id) => id.toString()),
									},
									pagination: {
										page: PAGINATION_DEFAULTS.PAGE,
										per: PAGINATION_DEFAULTS.PER_PAGE,
									},
								})
								return (
									data?.rows.map((unit) => ({
										label: unit.name,
										value: unit.id,
									})) ?? []
								)
							},
							urlParam: 'unit',
							defaultValues: [],
						},
						Icon: ToggleLeft,
					},
				] satisfies Filter[])
			: []),
	]

	return (
		<div className="rounded-md border p-3">
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<FilterSet label="Filters" urlParam="filters" filters={filters} />
			</div>
		</div>
	)
}
