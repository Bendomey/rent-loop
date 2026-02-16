import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
	AlertCircleIcon,
	EllipsisVertical,
	FileText,
	RotateCw,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLoaderData, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { DocumentsController } from './controller'
import { useDeleteDocument, useGetDocuments } from '~/api/documents'
import { DataTable } from '~/components/datatable'
import { Alert, AlertDescription } from '~/components/ui/alert'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
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
import { Spinner } from '~/components/ui/spinner'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS, QUERY_KEYS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { getNameInitials } from '~/lib/misc'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import type { loader } from '~/routes/_auth._dashboard.settings.documents'

export function DocumentsModule() {
	const { documentTemplates, error: documentError } =
		useLoaderData<typeof loader>()
	const [searchParams] = useSearchParams()
	const queryClient = useQueryClient()
	const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument()
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
	const [activeId, setActiveId] = useState<string | null>(null)

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const { data, isPending, isRefetching, error, refetch } = useGetDocuments({
		filters: { only_global_documents: true },
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
						<Link to={`/settings/documents/${row.original.id}`}>
							<span className="truncate text-xs text-blue-600 hover:underline">
								{row.original.title}
							</span>
						</Link>
						<span className="truncate text-xs text-zinc-600">
							Characters count: {row.original.size}
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
				cell: ({ row }) => (
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
							<Link to={`/settings/documents/${row.original.id}`}>
								<DropdownMenuItem>Edit</DropdownMenuItem>
							</Link>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								variant="destructive"
								onClick={() => {
									setActiveId(row.original.id)
									setOpenDeleteDialog(true)
								}}
							>
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
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
			{documentError ? (
				<Alert variant="destructive" className="border-red-600">
					<AlertCircleIcon />
					<AlertDescription>{documentError}</AlertDescription>
				</Alert>
			) : null}
			<DocumentsController documentTemplates={documentTemplates} />
			<div className="h-full w-full">
				<DataTable
					columns={columns}
					isLoading={isLoading}
					refetch={refetch}
					error={error ? 'Failed to load documents.' : undefined}
					dataResponse={{
						rows: data?.rows ?? [],
						total: data?.meta?.total ?? 0,
						page,
						page_size: per,
						order: data?.meta?.order ?? 'desc',
						order_by: data?.meta?.order_by ?? 'created_at',
						has_prev_page: data?.meta?.has_prev_page ?? false,
						has_next_page: data?.meta?.has_next_page ?? false,
					}}
					empty={{
						message: 'No documents found',
						description:
							"Try adjusting your search to find what you're looking for.",
					}}
				/>
			</div>

			<AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
				<AlertDialogContent className="sm:max-w-[425px]">
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will delete this document.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-5">
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={isDeleting}
							onClick={(e) => {
								e.preventDefault()
								if (!activeId || isDeleting) return
								deleteDocument(activeId, {
									onError: () => {
										toast.error('Failed to delete document. Try again later.')
									},
									onSuccess: () => {
										void queryClient.invalidateQueries({
											queryKey: [QUERY_KEYS.DOCUMENTS],
										})
										setOpenDeleteDialog(false)
										setActiveId(null)
									},
								})
							}}
							className="bg-destructive hover:bg-destructive/90 text-white"
						>
							{isDeleting ? <Spinner /> : null}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</main>
	)
}
