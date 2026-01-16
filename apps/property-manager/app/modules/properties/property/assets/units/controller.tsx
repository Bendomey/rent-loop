import { Plus, RotateCw, ToggleLeft } from 'lucide-react'
import { Link, useLoaderData } from 'react-router'
import { getPropertyBlocks } from '~/api/blocks'
import { FilterSet } from '~/components/filter-set'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { SearchInput } from '~/components/search'
import { Button } from '~/components/ui/button'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { cn } from '~/lib/utils'
import type { loader } from '~/routes/_auth.properties.$propertyId.assets.units._index'

export const PropertyAssetUnitsController = ({
	isLoading,
	refetch,
}: {
	isLoading: boolean
	refetch: VoidFunction
}) => {
	const { clientUserProperty } = useLoaderData<typeof loader>()

	const filters: Array<Filter> = [
		{
			id: 1,
			type: 'selector',
			selectType: 'single',
			label: 'Status',
			value: {
				options: [
					{ label: 'Active', value: 'Unit.Status.Active' },
					{ label: 'Inactive', value: 'Unit.Status.Inactive' },
					{ label: 'Maintenance', value: 'Unit.Status.Maintenance' },
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
			label: 'Blocks',
			value: {
				onSearch: async ({ ids }) => {
					if (!clientUserProperty?.property_id) {
						return []
					}

					const data = await getPropertyBlocks({
						property_id: clientUserProperty?.property_id,
						pagination: {
							page: PAGINATION_DEFAULTS.PAGE,
							per: PAGINATION_DEFAULTS.PER_PAGE,
						},
						filters: {
							ids: ids?.map((id) => id.toString()) || undefined,
						},
					})

					return (
						data?.rows.map((block) => ({
							label: block.name,
							value: block.id,
						})) ?? []
					)
				},
				urlParam: 'blocks',
				defaultValues: [],
			},
			Icon: ToggleLeft,
		},
	]

	return (
		<div className="flex w-full flex-col gap-2">
			<div className="w-full rounded-md border p-4">
				<div className="flex w-full flex-wrap items-center gap-2 text-sm">
					<FilterSet label="Filters" urlParam="filters" filters={filters} />
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2 text-sm">
					<SearchInput placeholder="Search units..." />
				</div>
				<div className="flex items-center justify-end gap-2">
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Link
							to={`/properties/${clientUserProperty?.property_id}/assets/units/new`}
						>
							<Button
								variant="default"
								size="sm"
								className="bg-rose-600 text-white hover:bg-rose-700"
							>
								<Plus className="size-4" />
								Add Unit
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
