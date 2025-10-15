import { Plus, RotateCw, Search, ToggleLeft } from 'lucide-react'
import { Link } from 'react-router'
import { FilterSet } from '~/components/filter-set'
import { Button } from '~/components/ui/button'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '~/components/ui/input-group'

const filters: Array<Filter> = [
	{
		id: 1,
		type: 'selector',
		selectType: 'single',
		label: 'Status',
		value: {
			options: [
				{ label: 'Active', value: 'ClientUser.Status.Active' },
				{ label: 'Inactive', value: 'ClientUser.Status.Inactive' },
			],
			urlParam: 'status',
			defaultValues: [],
		},
		Icon: ToggleLeft,
	},
	{
		id: 1,
		type: 'selector',
		selectType: 'single',
		label: 'Role',
		value: {
			options: [
				{ label: 'Owner', value: 'OWNER' },
				{ label: 'Admin', value: 'ADMIN' },
				{ label: 'Staff', value: 'STAFF' },
			],
			urlParam: 'role',
			defaultValues: [],
		},
		Icon: ToggleLeft,
	},
]

export const UsersController = () => {
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
						<InputGroupInput placeholder="Search users ..." />
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>
				</div>
				<div className="flex items-center justify-end gap-2">
					<Link to="/users/new">
						<Button
							variant="default"
							size="sm"
							className="bg-rose-600 text-white hover:bg-rose-700"
						>
							<Plus className="size-4" />
							Add User
						</Button>
					</Link>
					<Button variant="outline" size="sm">
						<RotateCw className="size-4" />
						Refresh
					</Button>
				</div>
			</div>
		</div>
	)
}
