import { Plus, RotateCw, ToggleLeft } from 'lucide-react'
import { Link } from 'react-router'
import { FilterSet } from '~/components/filter-set'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { SearchInput } from '~/components/search'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'

const filters: Array<Filter> = [
	{
		id: 1,
		type: 'selector',
		selectType: 'single',
		label: 'Status',
		value: {
			options: [
				{ label: 'InProgress', value: 'TenantApplication.Status.InProgress' },
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
			options: [
				// TODO: get unit values from API
				{ label: 'Unit 101', value: 'unit_101' },
				{ label: 'Unit 102', value: 'unit_102' },
			],
			urlParam: 'desired_unit',
			defaultValues: [],
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
]

export const PropertyTenantApplicationsController = ({
	isLoading,
	refetch,
}: {
	isLoading: boolean
	refetch: VoidFunction
}) => {
	const { clientUserProperty } = useProperty()

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
