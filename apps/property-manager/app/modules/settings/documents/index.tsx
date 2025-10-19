import type { ColumnDef } from '@tanstack/react-table'
import { EllipsisVertical, RotateCw } from 'lucide-react'
import { useMemo } from 'react'
import { DocumentsController } from './controller'
import { DataTable } from '~/components/datatable'
import { FileIcon } from '~/components/file-icon'
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
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import { getNameInitials } from '~/lib/misc'

export function DocumentsModule() {
	const columns: ColumnDef<AppDocument>[] = useMemo(() => {
		return [
			{
				id: 'drag',
				header: () => null,
				cell: ({ row }) => {
					const name = row.original?.name || ''
					return FileIcon(name)

				},
			},
			{
				accessorKey: 'name',
				header: 'Name',
				cell: ({ row }) => (
					<div className="flex min-w-32 flex-col items-start gap-1">
						<span className="truncate text-xs text-zinc-600">
							{row.original.name}
						</span>
						<span className="truncate text-xs text-zinc-600">
							{row.original.file_size}
						</span>
					</div>
				),
				enableHiding: false,
			},
			{
				accessorKey: 'owner',
				header: 'Owner',
				cell: ({ row }) => {
					return (
						<div className="min-w-32 flex items-center">
							<Avatar className='w-8 h-8'>
  <AvatarImage src="" />		
<AvatarFallback>
 {getNameInitials(row.original.owner.name)}
</AvatarFallback>
</Avatar>
							<span className="truncate text-xs text-zinc-600 pl-1.5">
								{row.original.owner.name}
							</span>
						</div>
					)
				},
				enableHiding: false,
			},
			{
				accessorKey: 'created_at',
				header: 'Created On',
				cell: ({ getValue }) => (
					<div className="min-w-32">
						<span className="truncate text-xs text-zinc-600">
							{localizedDayjs(getValue<Date>()).format('DD/MM/YYYY hh:mm a')}
						</span>
					</div>
				),
			},
			{
				accessorKey: 'updated_at',
				header: 'Last Updated',
				cell: ({ getValue }) => (
					<div className="min-w-32">
						<span className="truncate text-xs text-zinc-600">
							{localizedDayjs(getValue<Date>()).format('DD/MM/YYYY hh:mm a')}
						</span>
					</div>
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
									<DropdownMenuItem variant="destructive">
										Deactivate
									</DropdownMenuItem>
								</AlertDialogTrigger>
							</DropdownMenuContent>
						</DropdownMenu>
						<AlertDialogContent className="sm:max-w-[425px]">
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This will deactivate the member.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter className="mt-5">
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-white">
									Deactivate
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
			<div className="flex flex-row items-center justify-between">
			<div>
				<TypographyH4>Manage Documents</TypographyH4>
				<TypographyMuted>
					Manage your global templates here in one place. 
				</TypographyMuted>
			</div>
			<div>
					<Button variant="outline" size="sm">
						<RotateCw className="size-4" />
						Refresh
					</Button>
				</div>
			</div>
			<DocumentsController />
			<div className="h-full w-full">
				<DataTable
					columns={columns}
					dataResponse={{
						rows: [
							{
								id: '1',
								name: 'Tenant Agreement.pdf',
								file_size: '1.2MB',
								status: 'Document.Status.Completed',
								owner: {
									name: 'Gideon Bempong',
									profile_pic: 'https://github.com/shadcn.png',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '2',
								name: 'Tenant Agreement.docx',
								file_size: '1.2MB',
								status: 'Document.Status.Completed',
								owner: {
									name: 'Esther Bempong',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '3',
								name: 'Lease Agreement.doc',
								file_size: '850KB',
								status: 'Document.Status.Approved',
								owner: {
									name: 'Adwoa Mensah',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '4',
								name: 'Inventory List.xlsx',
								file_size: '420KB',
								status: 'Document.Status.InProgress',
								owner: {
									name: 'Kofi Adu',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '5',
								name: 'Inspection Report.pdf',
								file_size: '2.3MB',
								status: 'Document.Status.Completed',
								owner: {
									name: 'Abena Owusu',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '6',
								name: 'Renewal Notice.docx',
								file_size: '300KB',
								status: 'Document.Status.Draft',
								owner: {
									name: 'Yaw Boateng',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '7',
								name: 'Payment Receipt.pdf',
								file_size: '120KB',
								status: 'Document.Status.Approved',
								owner: {
									name: 'Selina Koranteng',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '8',
								name: 'Property Photos.zip',
								file_size: '6.8MB',
								status: 'Document.Status.Archived',
								owner: {
									name: 'Gideon Bempong',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
						] as AppDocument[],
						total: 150,
						page: 1,
						page_size: 50,
						order: 'desc',
						order_by: 'created_at',
						has_prev_page: false,
						has_next_page: true,
					}}
					empty={{
						message: 'No documents found',
						description:
							"Try adjusting your search to find what you're looking for.",
						button: {
							label: 'Add Document',
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
