import { Plus, RotateCw, Search, ToggleLeft } from 'lucide-react'
import { Link } from 'react-router'
import { FilterSet } from '~/components/filter-set'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '~/components/ui/input-group'
import { useProperty } from '~/providers/property-provider'

const filters: Array<Filter> = [
	{
		id: 1,
		type: 'selector',
		selectType: 'single',
		label: 'Status',
		value: {
			options: [
				{ label: 'Active', value: 'PropertyBlock.Status.Active' },
				{ label: 'Inactive', value: 'PropertyBlock.Status.Inactive' },
				{ label: 'Maintenance', value: 'PropertyBlock.Status.Maintenance' },
			],
			urlParam: 'status',
			defaultValues: [],
		},
		Icon: ToggleLeft,
	},
]

export const PropertyAssetBlocksController = () => {
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
					<InputGroup>
						<InputGroupInput placeholder="Search blocks ..." />
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>
				</div>
				<div className="flex items-center justify-end gap-2">
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Link
							to={`/properties/${clientUserProperty?.property_id}/assets/blocks/new`}
						>
							<Button
								variant="default"
								size="sm"
								className="bg-rose-600 text-white hover:bg-rose-700"
							>
								<Plus className="size-4" />
								Add Block
							</Button>
						</Link>
					</PropertyPermissionGuard>
					<Button variant="outline" size="sm">
						<RotateCw className="size-4" />
						Refresh
					</Button>
				</div>
			</div>
		</div>
	)
}
