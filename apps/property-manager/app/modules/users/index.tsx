import type { ColumnDef } from '@tanstack/react-table'
import { CircleCheck, CircleX, EllipsisVertical, User } from 'lucide-react'
import { useMemo } from 'react'
import { UsersController } from './controller'
import { DataTable } from '~/components/datatable'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

export function UsersModule() {

	const columns: ColumnDef<ClientUser>[] = useMemo(() => {
		return [
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
					<AlertDialog>
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
								<AlertDialogTrigger asChild>
									<DropdownMenuItem variant="destructive">Deactivate</DropdownMenuItem>
								</AlertDialogTrigger>

							</DropdownMenuContent>
						</DropdownMenu>
						<AlertDialogContent className="sm:max-w-[425px]">
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This will deactivate the user account.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter className='mt-5'>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">Deactivate</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				),
			},
		]
	}, [])

	return (
		<div className="flex flex-col gap-2 sm:gap-4">
			<UsersController />
			<div className="h-full w-full">
				<DataTable
					columns={columns}
					dataResponse={{
						rows: [
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
						],
						total: 150,
						page: 1,
						page_size: 50,
						order: 'desc',
						order_by: 'created_at',
						has_prev_page: false,
						has_next_page: true,
					}}
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
