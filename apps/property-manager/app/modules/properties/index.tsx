import type { ColumnDef } from '@tanstack/react-table'
import { Building, CircleCheck, CircleX, EllipsisVertical } from 'lucide-react'
import { useMemo } from 'react'
import { PropertiesController } from './controller'
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
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

export function PropertiesModule() {
	const columns: ColumnDef<Property>[] = useMemo(() => {
		return [
			{
				id: 'drag',
				header: () => null,
				cell: () => <Building />,
			},
			{
				accessorKey: 'name',
				header: 'Name',
				cell: ({ getValue }) => {
					return (
						<div className="min-w-32">
							<span className="truncate text-xs text-zinc-600">
								{getValue<string>()}
							</span>
						</div>
					)
				},
				enableHiding: false,
			},
			{
				accessorKey: 'address',
				header: 'Address',
				cell: ({ row }) => (
					<div className="flex min-w-32 flex-col items-start gap-1">
						<span className="truncate text-xs text-zinc-600">
							{row.original.address}
						</span>
					</div>
				),
			},
			{
				accessorKey: 'type',
				header: 'Type',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						<span className="truncate text-xs text-zinc-600">
							{getValue<string>()}
						</span>
					</Badge>
				),
			},

			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						{getValue<string>() === 'Property.Status.Active' ? (
							<CircleCheck className="fill-green-600 text-white" />
						) : getValue<string>() === 'Property.Status.Maintenance' ? (
							<CircleCheck className="fill-yellow-600 text-white" />
						) : (
							<CircleX className="fill-red-500 text-white" />
						)}
						{getValue<string>() === 'Property.Status.Active'
							? 'Active'
							: getValue<string>() === 'Property.Status.Maintenance'
							? 'Maintenance'
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
								<DropdownMenuItem>View</DropdownMenuItem>
								<DropdownMenuItem>Edit</DropdownMenuItem>
								<DropdownMenuSeparator />
								<AlertDialogTrigger asChild>
									<DropdownMenuItem variant="destructive">
										Delete
									</DropdownMenuItem>
								</AlertDialogTrigger>
							</DropdownMenuContent>
						</DropdownMenu>
						<AlertDialogContent className="sm:max-w-[425px]">
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This will delete this Property.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter className="mt-5">
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-white">
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				),
			},
		]
	}, [])

	return (
		<main className="flex flex-col gap-2 sm:gap-4">
			<PropertiesController />
			<div className="h-full w-full">
				<DataTable
					columns={columns}
					dataResponse={{
						rows: [
							{
								id: '1',
								name: 'La Palm Beach Hotel',
								address: 'Labadi Beach, Accra',
								city: 'Accra',
								state: 'Greater Accra',
								zip_code: '00233',
								type: 'SINGLE',
								created_at: new Date(),
								updated_at: new Date(),
								status: 'Property.Status.Active',
							},
							{
								id: '2',
								name: 'Kumasi City Hostel',
								address: 'Kejetia, Kumasi Central',
								city: 'Kumasi',
								state: 'Ashanti',
								zip_code: '00232',
								type: 'MULTI',
								created_at: new Date(),
								updated_at: new Date(),
								status: 'Property.Status.Maintenance',
							},
							{
								id: '3',
								name: 'Cape Coast Tourist Inn',
								address: 'Castle Road, Cape Coast',
								city: 'Cape Coast',
								state: 'Central',
								zip_code: '00231',
								type: 'SINGLE',
								created_at: new Date(),
								updated_at: new Date(),
								status: 'Property.Status.Inactive',
							},
							{
								id: '4',
								name: 'Takoradi Seafront Hotel',
								address: 'Takoradi Harbour Road',
								city: 'Takoradi',
								state: 'Western',
								zip_code: '00234',
								type: 'SINGLE',
								created_at: new Date(),
								updated_at: new Date(),
								status: 'Property.Status.Active',
							},
							{
								id: '5',
								name: 'Tamale Central Lodge',
								address: 'Market Circle, Tamale',
								city: 'Tamale',
								state: 'Northern',
								zip_code: '00240',
								type: 'MULTI',
								created_at: new Date(),
								updated_at: new Date(),
								status: 'Property.Status.Inactive',
							},
							{
								id: '6',
								name: 'Osu Boutique Hotel',
								address: 'Osu Oxford Street, Accra',
								city: 'Accra',
								state: 'Greater Accra',
								zip_code: '00233',
								type: 'MULTI',
								created_at: new Date(),
								updated_at: new Date(),
								status: 'Property.Status.Active',
							},
							{
								id: '7',
								name: 'East Legon Serviced Apartments',
								address: 'East Legon Link Road, Accra',
								city: 'Accra',
								state: 'Greater Accra',
								zip_code: '00233',
								type: 'MULTI',
								created_at: new Date(),
								updated_at: new Date(),
								status: 'Property.Status.Inactive',
							},
							{
								id: '8',
								name: 'Tema Riverside Guesthouse',
								address: 'Community 1, Tema',
								city: 'Tema',
								state: 'Greater Accra',
								zip_code: '00236',
								type: 'SINGLE',
								created_at: new Date(),
								updated_at: new Date(),
								status: 'Property.Status.Active',
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
						message: 'No properties found',
						description:
							"Try adjusting your search or filter to find what you're looking for.",
						button: {
							label: 'Add Property',
							onClick: () => {
								// Handle button click
							},
						},
					}}
				/>
			</div>
		</main>
	)
}
