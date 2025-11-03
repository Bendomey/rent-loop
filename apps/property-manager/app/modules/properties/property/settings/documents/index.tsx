import type { ColumnDef } from '@tanstack/react-table'
import { EllipsisVertical, FileText, RotateCw } from 'lucide-react'
import { useMemo } from 'react'
import { useLoaderData, useParams, useSearchParams } from 'react-router'
import { PropertyDocumentsController } from './controller'
import { useGetDocuments } from '~/api/documents'
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
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { getNameInitials } from '~/lib/misc'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import type { loader } from '~/routes/_auth._dashboard.settings.documents'

// TODO: fetch single property from loader data
const property: Property = {
	id: 'property-id',
	name: 'Sample Property',
	slug: 'sample-property',
	address: '123 Main St, Anytown, USA',
	city: 'Anytown',
	state: 'CA',
	description: 'A sample property for demonstration purposes.',
	created_at: new Date(),
	updated_at: new Date(),
	gps_address: '123 Main St, Anytown, USA',
	status: 'Property.Status.Active',
	tags: [],
	type: 'SINGLE',
	zip_code: '12345',
}
export function PropertyDocumentsSettingsModule() {
	const { documentTemplates } = useLoaderData<typeof loader>()
	const params = useParams()
	const [searchParams] = useSearchParams()

	const page = searchParams.get('page')
		? Number(searchParams.get('page')) + 1
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('per_page')
		? Number(searchParams.get('per_page'))
		: PAGINATION_DEFAULTS.PER_PAGE

	const { data, isPending, isRefetching, error, refetch } = useGetDocuments({
		filters: {
			property_slug: params.propertySlug,
		},
		pagination: { page, per },
		populate: ['CreatedBy'],
		sorter: { sort: 'desc', sort_by: 'created_at' },
		search: {
			query: searchParams.get('query') ?? undefined,
			fields: ['title'],
		},
	})
	const isLoading = isPending || isRefetching

	const columns: ColumnDef<RentloopDocument>[] = useMemo(() => {
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
							{row.original.title}
						</span>
						<span className="truncate text-xs text-zinc-600">
							{row.original.size}
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
									{getNameInitials(safeString(row.original.created_by?.name))}
								</AvatarFallback>
							</Avatar>
							<span className="truncate pl-1.5 text-xs text-zinc-600">
								{safeString(row.original.created_by?.name)}
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
					<TypographyH4>Manage Documents</TypographyH4>
					<TypographyMuted>
						Manage your templates here in one place.
					</TypographyMuted>
				</div>
				<div>
					{isPending ? null : (
						<Button
							onClick={() => refetch()}
							disabled={isLoading}
							variant="outline"
							size="sm"
						>
							<RotateCw
								className={cn('size-4', { 'animate-spin': isLoading })}
							/>
							Refresh
						</Button>
					)}
				</div>
			</div>
			<PropertyDocumentsController
				property={property}
				documentTemplates={documentTemplates}
			/>
			<div className="h-full w-full">
				<DataTable
					columns={columns}
					isLoading={isLoading}
					refetch={refetch}
					error={error ? 'Failed to load documents.' : undefined}
					dataResponse={{
						rows: data?.rows ?? [],
						total: data?.total ?? 0,
						page,
						page_size: per,
						order: data?.order ?? 'desc',
						order_by: data?.order_by ?? 'created_at',
						has_prev_page: data?.has_prev_page ?? false,
						has_next_page: data?.has_next_page ?? false,
					}}
					empty={{
						message: 'No documents found',
						description:
							"Try adjusting your search to find what you're looking for.",
					}}
				/>
			</div>
		</main>
	)
}
