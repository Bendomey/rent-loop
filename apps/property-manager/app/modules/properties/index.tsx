import type { ColumnDef } from '@tanstack/react-table'
import { Building, CircleCheck, CircleX, Eye } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PropertiesController } from './controller'
import { useGetMyProperties } from '~/api/properties'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'

export function PropertiesModule() {
	const [searchParams] = useSearchParams()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE

	const { data, isPending, isRefetching, error, refetch } = useGetMyProperties({
		filters: {},
		pagination: { page, per },
		populate: ['Property'],
		sorter: { sort: 'desc', sort_by: 'created_at' },
		search: {
			query: searchParams.get('query') ?? undefined,
			fields: ['Property.name', 'Property.address'],
		},
	})

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<ClientUserProperty>[] = useMemo(() => {
		return [
			{
				id: 'drag',
				header: () => null,
				cell: () => <Building />,
			},
			{
				accessorKey: 'property.name',
				header: 'Name',
				cell: ({ getValue, row }) => {
					return (
						<div className="flex min-w-32 flex-col items-start gap-1">
							<Link
								to={`/properties/${row.original.property?.slug}`}
								aria-label={`View details for property ${getValue<string>()}`}
							>
								<span className="truncate text-xs text-blue-600 hover:underline">
									{getValue<string>()}
								</span>
							</Link>

							<Badge variant="outline" className="text-muted-foreground px-1.5">
								<span className="truncate text-xs text-zinc-600">
									{row.original.property?.type}
								</span>
							</Badge>
						</div>
					)
				},
				enableHiding: false,
			},
			{
				accessorKey: 'property.address',
				header: 'Address',
				cell: ({ row }) => (
					<div className="flex min-w-32 flex-col items-start gap-1">
						<span className="truncate text-xs text-zinc-600">
							{row.original.property?.address}
						</span>
					</div>
				),
			},

			{
				accessorKey: 'property.status',
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
					<Link to={`/properties/${row.original.property?.slug}`}>
						<Button
							variant="ghost"
							className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
							size="icon"
						>
							<Eye />
							<span className="sr-only">Open property</span>
						</Button>
					</Link>
				),
			},
		]
	}, [])

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
