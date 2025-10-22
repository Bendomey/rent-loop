import type { ColumnDef } from '@tanstack/react-table'
import { EllipsisVertical, FileText, RotateCw } from 'lucide-react'
import { useMemo } from 'react'
import { useLoaderData } from 'react-router'
import { DocumentsController } from './controller'
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
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
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
import type { loader } from '~/routes/_auth._dashboard.settings.documents'

export function DocumentsModule() {
	const { documentTemplates } = useLoaderData<typeof loader>()
	const columns: ColumnDef<AppDocument>[] = useMemo(() => {
		return [
			{
				id: 'drag',
				header: () => null,
				cell: () => {
					return (
						<Badge
							variant="outline"
							className={`flex h-9 w-9 flex-col bg-blue-100 p-0.5`}
						>
							<FileText className={`h-full w-full text-blue-600`} />
							<span className="text-[7px] font-bold text-black">DOCX</span>
						</Badge>
					)
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
				accessorKey: 'created_by',
				header: 'Owner',
				cell: ({ row }) => {
					return (
						<div className="flex min-w-32 items-center">
							<Avatar className="h-8 w-8">
								<AvatarImage src="" />
								<AvatarFallback>
									{getNameInitials(row.original.created_by.name)}
								</AvatarFallback>
							</Avatar>
							<span className="truncate pl-1.5 text-xs text-zinc-600">
								{row.original.created_by.name}
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
										Delete
									</DropdownMenuItem>
								</AlertDialogTrigger>
							</DropdownMenuContent>
						</DropdownMenu>
						<AlertDialogContent className="sm:max-w-[425px]">
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This will delete the document.
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
			<div className="flex flex-row items-center justify-between">
				<div>
					<TypographyH4>Manage Document Templates</TypographyH4>
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
			<DocumentsController documentTemplates={documentTemplates} />
			<div className="h-full w-full">
				<DataTable
					columns={columns}
					dataResponse={{
						rows: [
							{
								id: '1',
								name: 'Tenant Agreement',
								file_size: '1.2MB',
								created_by: {
									name: 'Gideon Bempong',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '2',
								name: 'Tenant Agreement',
								file_size: '1.2MB',
								created_by: {
									name: 'Esther Bempong',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '3',
								name: 'Lease Agreement',
								file_size: '850KB',
								created_by: {
									name: 'Adwoa Mensah',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '4',
								name: 'Inventory List',
								file_size: '420KB',
								created_by: {
									name: 'Kofi Adu',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '5',
								name: 'Inspection Report',
								file_size: '2.3MB',
								created_by: {
									name: 'Abena Owusu',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '6',
								name: 'Renewal Notice',
								file_size: '300KB',
								created_by: {
									name: 'Yaw Boateng',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '7',
								name: 'Payment Receipt',
								file_size: '120KB',
								created_by: {
									name: 'Selina Koranteng',
								},
								created_at: new Date(),
								updated_at: new Date(),
							},
							{
								id: '8',
								name: 'Property Photos',
								file_size: '6.8MB',
								created_by: {
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
