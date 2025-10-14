import type { ColumnDef } from '@tanstack/react-table'
import { CircleCheck, EllipsisVertical, Loader, User } from 'lucide-react'
import { UsersController } from './controller'
import { DataTable } from './table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
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
		cell: ({ row }) => <User />,
	},
	{
		accessorKey: 'name',
		header: 'Name',
		cell: ({ getValue }) => {
			return <span>{getValue<string>()}</span>
		},
		enableHiding: false,
	},
	{
		accessorKey: 'role',
		header: 'Role',
		cell: ({ getValue }) => (
			<Badge variant="outline" className="text-muted-foreground px-1.5">
				<span className="truncate">{getValue<string>()}</span>
			</Badge>
		),
	},
	{
		accessorKey: 'email',
		header: 'Email',
		cell: ({ row }) => (
			<div className="w-32">
				<span className="truncate">{row.original.email}</span>
			</div>
		),
	},
	{
		accessorKey: 'phone_number',
		header: 'Phone',
		cell: ({ row }) => (
			<div className="w-32">
				<span className="truncate">{row.original.phone_number}</span>
			</div>
		),
	},

	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => (
			<Badge variant="outline" className="text-muted-foreground px-1.5">
				{true ? <CircleCheck className="fill-green-500" /> : <Loader />}
				{/* {row.original.status} */}Active
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
			<Card className="bg-background w-full">
				{/* <DataTable data={[]} /> */}
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
						},
					]}
				/>
			</Card>
		</div>
	)
}
