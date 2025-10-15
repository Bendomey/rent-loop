import type { ColumnDef } from '@tanstack/react-table'
import { CircleCheck, CircleX, EllipsisVertical, User } from 'lucide-react'
import { UsersController } from './controller'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

const columns: ColumnDef<ClientUser>[] = [
	{
		id: 'drag',
		header: () => null,
		cell: () => <User />,
	},
	{
		accessorKey: 'name',
		header: 'Name',
		cell: ({ getValue }) => {
			return (
				<div className="min-w-40">
					<span className="truncate text-xs text-zinc-600">
						{getValue<string>()}
					</span>
				</div>
			)
		},
		enableHiding: false,
	},
	{
		accessorKey: 'role',
		header: 'Role',
		cell: ({ getValue }) => (
			<Badge variant="outline" className="text-muted-foreground px-1.5">
				<span className="truncate text-xs text-zinc-600">
					{getValue<string>()}
				</span>
			</Badge>
		),
	},
	{
		accessorKey: 'email',
		header: 'Email',
		cell: ({ getValue }) => (
			<div className="min-w-32">
				<span className="truncate text-xs text-zinc-600">
					{getValue<string>()}
				</span>
			</div>
		),
	},
	{
		accessorKey: 'phone_number',
		header: 'Phone',
		cell: ({ getValue }) => (
			<span className="truncate text-xs text-zinc-600">
				{getValue<string>()}
			</span>
		),
	},

	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ getValue }) => (
			<Badge variant="outline" className="text-muted-foreground px-1.5">
				{getValue<string>() === 'ClientUser.Status.Active' ? (
					<CircleCheck className="fill-green-600 text-white" />
				) : (
					<CircleX className="fill-red-500 text-white" />
				)}
				{getValue<string>() === 'ClientUser.Status.Active'
					? 'Active'
					: 'Inactive'}
			</Badge>
		),
	},
	{
		id: 'actions',
		cell: () => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
						size="icon"
					>
						<EllipsisVertical />
						<span className="sr-only">Open menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-32">
					<DropdownMenuItem>Edit</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem variant="destructive">Deactivate</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
]

export function UsersModule() {
	return (
		<div className="flex flex-col gap-2 sm:gap-4">
			<UsersController />
			<div className="h-full w-full">
				<DataTable
					columns={columns}
					data={[
						{
							id: '1',
							name: 'John Doe',
							email: 'john.doe@example.com',
							phone_number: '123-456-7890',
							role: 'OWNER',
							created_at: new Date(),
							updated_at: new Date(),
							client: null,
							client_id: '1',
							status: 'ClientUser.Status.Active',
						},
						{
							id: '1',
							name: 'John Doe',
							email: 'john.doe@example.com',
							phone_number: '123-456-7890',
							role: 'OWNER',
							created_at: new Date(),
							updated_at: new Date(),
							client: null,
							client_id: '1',
							status: 'ClientUser.Status.Active',
						},
						{
							id: '1',
							name: 'John Doe',
							email: 'john.doe@example.com',
							phone_number: '123-456-7890',
							role: 'OWNER',
							created_at: new Date(),
							updated_at: new Date(),
							client: null,
							client_id: '1',
							status: 'ClientUser.Status.Active',
						},
					]}
					error="Could not fetch users."
					empty={{
						message: 'No users found',
						description:
							"Try adjusting your search or filter to find what you're looking for.",
						button: {
							label: 'Add User',
							onClick: () => {
								// Handle button click
							},
						},
					}}
				/>
			</div>
		</div>
	)
}
