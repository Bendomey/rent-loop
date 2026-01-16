import { Plus, RotateCw, ToggleLeft } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { getPropertyUnits } from '~/api/units'
import { FilterSet } from '~/components/filter-set'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { SearchInput } from '~/components/search'
import { Button } from '~/components/ui/button'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'

export const PropertyTenantApplicationsController = ({
	isLoading,
	refetch,
}: {
	isLoading: boolean
	refetch: VoidFunction
}) => {
	const { clientUserProperty } = useProperty()

	const filters: Array<Filter> = useMemo(
		() => [
			{
				id: 1,
				type: 'selector',
				selectType: 'single',
				label: 'Status',
				value: {
					options: [
						{
							label: 'InProgress',
							value: 'TenantApplication.Status.InProgress',
						},
						{ label: 'Cancelled', value: 'TenantApplication.Status.Cancelled' },
						{ label: 'Completed', value: 'TenantApplication.Status.Completed' },
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
				label: 'Desired Unit',
				value: {
					urlParam: 'desired_unit',
					defaultValues: [],
					onSearch: async ({}) => {
						if (!clientUserProperty?.property_id) {
							return []
						}

						const data = await getPropertyUnits({
							property_id: clientUserProperty.property_id,
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
				},
				Icon: ToggleLeft,
			},
			{
				id: 3,
				type: 'selector',
				selectType: 'single',
				label: 'Gender',
				value: {
					options: [
						{ label: 'Male', value: 'MALE' },
						{ label: 'Female', value: 'FEMALE' },
					],
					urlParam: 'gender',
					defaultValues: [],
				},
				Icon: ToggleLeft,
			},
			{
				id: 4,
				type: 'selector',
				selectType: 'single',
				label: 'Marital Status',
				value: {
					options: [
						{ label: 'Single', value: 'SINGLE' },
						{ label: 'Married', value: 'MARRIED' },
						{ label: 'Divorced', value: 'DIVORCED' },
						{ label: 'Widowed', value: 'WIDOWED' },
					],
					urlParam: 'marital_status',
					defaultValues: [],
				},
				Icon: ToggleLeft,
			},
		],
		[clientUserProperty?.property_id],
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
					<SearchInput placeholder="Search tenant applications..." />
				</div>
				<div className="flex items-center justify-end gap-2">
					<PropertyPermissionGuard roles={['MANAGER', 'STAFF']}>
						<Link
							to={`/properties/${clientUserProperty?.property_id}/tenants/applications/new`}
						>
							<Button
								variant="default"
								size="sm"
								className="bg-rose-600 text-white hover:bg-rose-700"
							>
								<Plus className="size-4" />
								Add Tenant Application
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
