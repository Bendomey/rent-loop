import { RotateCw, ToggleLeft } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { getPropertyUnits } from '~/api/units'
import { FilterSet } from '~/components/filter-set'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

export function PropertyBookingsController({
	isLoading,
	refetch,
}: {
	isLoading: boolean
	refetch: VoidFunction
}) {
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()

	const filters: Array<Filter> = useMemo(
		() => [
			{
				id: 1,
				type: 'selector',
				selectType: 'single',
				label: 'Status',
				value: {
					options: [
						{ label: 'Pending', value: 'PENDING' },
						{ label: 'Confirmed', value: 'CONFIRMED' },
						{ label: 'Checked In', value: 'CHECKED_IN' },
						{ label: 'Completed', value: 'COMPLETED' },
						{ label: 'Cancelled', value: 'CANCELLED' },
					],
					urlParam: 'status',
					defaultValues: [],
				},
				Icon: ToggleLeft,
			},
			{
				id: 2,
				type: 'selector',
				selectType: 'single',
				label: 'Unit',
				value: {
					urlParam: 'unit_id',
					defaultValues: [],
					onSearch: async ({}) => {
						if (!clientUserProperty?.property_id) return []
						const data = await getPropertyUnits(
							safeString(clientUser?.client_id),
							{
								property_id: clientUserProperty.property_id,
								pagination: {
									page: PAGINATION_DEFAULTS.PAGE,
									per: PAGINATION_DEFAULTS.PER_PAGE,
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
		],
		[clientUser?.client_id, clientUserProperty?.property_id],
	)

	return (
		<div className="flex w-full flex-col gap-2">
			<div className="w-full rounded-md border p-4">
				<div className="flex w-full flex-wrap items-center gap-2 text-sm">
					<FilterSet label="Filters" urlParam="filters" filters={filters} />
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div />
				<div className="flex items-center justify-end gap-2">
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Link
							to={`/properties/${clientUserProperty?.property_id}/occupancy/bookings/new`}
						>
							<Button
								size="sm"
								className="bg-rose-600 text-white hover:bg-rose-700"
							>
								New Booking
							</Button>
						</Link>
					</PropertyPermissionGuard>
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
