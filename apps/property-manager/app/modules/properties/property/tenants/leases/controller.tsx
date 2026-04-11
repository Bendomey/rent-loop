import { RotateCw, ToggleLeft } from 'lucide-react'
import { useMemo } from 'react'
import { getPropertyUnits } from '~/api/units'
import { FilterSet } from '~/components/filter-set'
import { SearchInput } from '~/components/search'
import { Button } from '~/components/ui/button'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

export const PropertyTenantLeasesController = ({
	isLoading,
	refetch,
}: {
	isLoading: boolean
	refetch: VoidFunction
}) => {
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const isMultiProperty = clientUserProperty?.property?.type === 'MULTI'

	const filters: Array<Filter> = useMemo(
		() => [
			{
				id: 1,
				type: 'selector',
				selectType: 'single',
				label: 'Status',
				value: {
					options: [
						{ label: 'Pending', value: 'Lease.Status.Pending' },
						{ label: 'Active', value: 'Lease.Status.Active' },
						{ label: 'Completed', value: 'Lease.Status.Completed' },
						{ label: 'Cancelled', value: 'Lease.Status.Cancelled' },
						{ label: 'Terminated', value: 'Lease.Status.Terminated' },
					],
					urlParam: 'status',
					defaultValues: [],
				},
				Icon: ToggleLeft,
			},
			...(isMultiProperty
				? ([
						{
							id: 2,
							type: 'selector',
							selectType: 'multi',
							label: 'Units',
							value: {
								urlParam: 'unit_ids',
								defaultValues: [],
								onSearch: async ({ ids }: { ids?: Array<string | number> }) => {
									if (!clientUserProperty?.property_id) {
										return []
									}
									const data = await getPropertyUnits(
										safeString(clientUser?.client_id),
										{
											property_id: clientUserProperty.property_id,
											pagination: {
												page: PAGINATION_DEFAULTS.PAGE,
												per: PAGINATION_DEFAULTS.PER_PAGE,
											},
											filters: {
												ids: ids?.map((id) => id.toString()) || undefined,
											},
										},
									)
									return (
										data?.rows.map((unit) => ({
											label: unit.name,
											value: unit.id,
										})) ?? []
									)
								},
							},
							Icon: ToggleLeft,
						},
					] as Array<Filter>)
				: []),
		],
		[clientUserProperty?.property_id, isMultiProperty],
	)

	return (
		<div className="flex w-full flex-col gap-2">
			<div className="w-full rounded-md border p-4">
				<div className="flex w-full flex-wrap items-center gap-2 text-sm">
					<FilterSet label="Filters" urlParam="filters" filters={filters} />
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2 text-sm">
					<SearchInput placeholder="Search by lease code..." />
				</div>
				<div className="flex items-center justify-end gap-2">
					<Button
						onClick={() => refetch()}
						disabled={isLoading}
						variant="outline"
						size="sm"
					>
						<RotateCw className={cn('size-4', { 'animate-spin': isLoading })} />
						Refresh
					</Button>
				</div>
			</div>
		</div>
	)
}
