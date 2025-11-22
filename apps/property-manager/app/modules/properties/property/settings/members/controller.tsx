import { Plus, RotateCw, Search, ToggleLeft } from 'lucide-react'
import { useState } from 'react'
import AddMemberModule from './add'
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
				{ label: 'Manager', value: 'MANAGER' },
				{ label: 'Staff', value: 'STAFF' },
			],
			urlParam: 'role',
			defaultValues: [],
		},
		Icon: ToggleLeft,
	},
]

export const MembersController = () => {
	const [openAddMemberModal, setOpenAddMemberModal] = useState(false)

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
						<InputGroupInput placeholder="Search members ..." />
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>
				</div>
				<div className="flex items-center justify-end gap-2">
					<Button
						variant="default"
						size="sm"
						onClick={() => setOpenAddMemberModal(true)}
					>
						<Plus className="size-4" />
						Add Member
					</Button>
					<Button variant="outline" size="sm">
						<RotateCw className="size-4" />
						Refresh
					</Button>
				</div>
			</div>
			<AddMemberModule
				opened={openAddMemberModal}
				setOpened={setOpenAddMemberModal}
			/>
		</div>
	)
}
