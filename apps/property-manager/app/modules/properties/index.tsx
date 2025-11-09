import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Building, CircleCheck, CircleX, EllipsisVertical } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { PropertiesController } from './controller'
import { useDeleteProperty, useGetProperties } from '~/api/properties'
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
import { Spinner } from '~/components/ui/spinner'
import { PAGINATION_DEFAULTS, QUERY_KEYS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'

export function PropertiesModule() {
	const [searchParams] = useSearchParams()
	const queryClient = useQueryClient()
	const { mutate: deleteProperty, isPending: isDeleting } = useDeleteProperty()
	const [deletingId, setDeletingId] = useState<string | null>(null)

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const type = searchParams.get('type') ?? undefined
	const status = searchParams.get('status') ?? undefined

	const { data, isPending, isRefetching, error, refetch } = useGetProperties({
		filters: { type: type, status: status },
		pagination: { page, per },
		populate: ['CreatedBy'],
		sorter: { sort: 'desc', sort_by: 'created_at' },
		search: {
			query: searchParams.get('query') ?? undefined,
			fields: ['name', 'address'],
		},
	})

	const isLoading = isPending || isRefetching

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
				cell: ({ getValue, row }) => {
					return (
						<div className="flex min-w-32 flex-col items-start gap-1">
							<Link
								to={`/properties/${row.original.slug}`}
								aria-label={`View details for property ${getValue<string>()}`}
							>
								<span className="truncate text-xs text-blue-600 hover:underline">
									{getValue<string>()}
								</span>
							</Link>

							<Badge variant="outline" className="text-muted-foreground px-1.5">
								<span className="truncate text-xs text-zinc-600">
									{row.original.type}
								</span>
							</Badge>
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
				id: 'actions',
				cell: ({ row }) => (
					<AlertDialog
						open={deletingId === row.original.id}
						onOpenChange={(open) => {
							if (!open) setDeletingId(null)
						}}
					>
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
								<Link to={`/properties/${row.original.slug}`}>
									<DropdownMenuItem>View</DropdownMenuItem>
								</Link>
								<DropdownMenuSeparator />
								<AlertDialogTrigger asChild>
									<DropdownMenuItem
										variant="destructive"
										onClick={() => setDeletingId(row.original.id)}
									>
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
								<AlertDialogCancel disabled={isDeleting}>
									Cancel
								</AlertDialogCancel>
								<AlertDialogAction
									disabled={isDeleting}
									onClick={(e) => {
										e.preventDefault()
										deleteProperty(row.original.id, {
											onError: () => {
												toast.error(
													'Failed to delete property. Try again later.',
												)
											},
											onSuccess: () => {
												void queryClient.invalidateQueries({
													queryKey: [QUERY_KEYS.PROPERTIES],
												})
												setDeletingId(null)
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
				),
			},
		]
	}, [deleteProperty, isDeleting, deletingId, queryClient])

	return (
		<main className="flex flex-col gap-2 sm:gap-4">
			<PropertiesController isLoading={isLoading} refetch={refetch} />
			<div className="h-full w-full">
				<DataTable
					columns={columns}
					isLoading={isLoading}
					refetch={refetch}
					error={error ? 'Failed to load properties.' : undefined}
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
						message: 'No properties found',
						description:
							"Try adjusting your search to find what you're looking for.",
					}}
				/>
			</div>
		</main>
	)
}
