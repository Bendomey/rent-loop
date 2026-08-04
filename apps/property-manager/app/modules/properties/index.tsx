import type { ColumnDef } from '@tanstack/react-table'
import { Building, CircleCheck, CircleX, Eye } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PropertiesController } from './controller'
import { useGetMyProperties } from '~/api/properties'
import { DataTable, useDataTableSort } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	ASSET_MANAGEMENT_GUIDE_URL,
	PAGINATION_DEFAULTS,
} from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'

/**
 * Fields the API may be asked to order by. `sort_by` is interpolated into the
 * backend's ORDER BY clause, so only these — never a raw URL value — are
 * forwarded. Each one must match a column's `meta.sortKey`.
 */
const SORTABLE_FIELDS = [
	'properties.name',
	'properties.address',
	'properties.blocks_count',
	'properties.units_count',
	'properties.status',
	'client_user_properties.created_at',
]

/** A count with its unit word, dimmed when there is nothing to count. */
function CountCell({
	value,
	one,
	many,
}: {
	value: number
	one: string
	many: string
}) {
	return (
		<span className="inline-flex items-baseline gap-1.5">
			<span
				className={cn(
					'font-mono text-[15px] font-bold',
					value === 0 ? 'text-muted-foreground/60' : 'text-foreground',
				)}
			>
				{value}
			</span>
			<span className="text-muted-foreground text-[13.5px]">
				{value === 1 ? one : many}
			</span>
		</span>
	)
}

export function PropertiesModule() {
	const [searchParams] = useSearchParams()
	const { clientUser } = useClient()
	const sorter = useDataTableSort(SORTABLE_FIELDS, {
		sort_by: 'client_user_properties.created_at',
		sort: 'desc',
	})

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE

	const property_status = searchParams.get('property_status') ?? undefined
	const property_type = searchParams.get('property_type') ?? undefined

	const { data, isPending, isRefetching, error, refetch } = useGetMyProperties(
		safeString(clientUser?.client_id),
		{
			filters: {
				property_status,
				property_type,
			},
			pagination: { page, per },
			populate: ['Property'],
			sorter,
			search: {
				query: searchParams.get('query') ?? undefined,
				fields: ['Property.name', 'Property.address'],
			},
		},
	)

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<ClientUserProperty>[] = useMemo(() => {
		return [
			{
				accessorKey: 'property.name',
				header: 'Property',
				size: 280,
				enableSorting: true,
				enableHiding: false,
				meta: { pin: 'left', sortKey: 'properties.name', label: 'Property' },
				cell: ({ getValue, row }) => {
					return (
						<div className="flex min-w-0 items-center gap-3.5">
							<div className="bg-muted border-border flex size-11 shrink-0 items-center justify-center rounded-lg border">
								<Building className="text-foreground-soft size-5.5" />
							</div>
							<div className="min-w-0">
								<Link
									to={`/properties/${row.original.property?.id}`}
									aria-label={`View details for property ${getValue<string>()}`}
								>
									<span className="text-primary block truncate text-[15px] font-semibold hover:underline">
										{getValue<string>()}
									</span>
								</Link>
								<Badge
									variant="outline"
									className="text-muted-foreground mt-1.5 px-1.5 font-mono text-[10.5px] font-bold tracking-wider"
								>
									{row.original.property?.type}
								</Badge>
							</div>
						</div>
					)
				},
			},
			{
				accessorKey: 'property.address',
				header: 'Address',
				size: 260,
				enableSorting: true,
				meta: { sortKey: 'properties.address', label: 'Address' },
				cell: ({ row }) => (
					<span className="text-foreground-soft line-clamp-2 text-sm leading-snug">
						{row.original.property?.address}
					</span>
				),
			},

			{
				accessorKey: 'property.blocks_count',
				header: 'Blocks',
				size: 130,
				enableSorting: true,
				meta: {
					sortKey: 'properties.blocks_count',
					label: 'Blocks',
					align: 'right',
				},
				cell: ({ getValue }) => (
					<CountCell
						value={getValue<number>() ?? 0}
						one="block"
						many="blocks"
					/>
				),
			},
			{
				accessorKey: 'property.units_count',
				header: 'Units',
				size: 130,
				enableSorting: true,
				meta: {
					sortKey: 'properties.units_count',
					label: 'Units',
					align: 'right',
				},
				cell: ({ getValue }) => (
					<CountCell value={getValue<number>() ?? 0} one="unit" many="units" />
				),
			},
			{
				accessorKey: 'property.status',
				header: 'Status',
				size: 150,
				enableSorting: true,
				meta: { sortKey: 'properties.status', label: 'Status' },
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
				size: 190,
				enableSorting: true,
				meta: {
					sortKey: 'client_user_properties.created_at',
					label: 'Created On',
				},
				cell: ({ getValue }) => (
					<span className="text-muted-foreground font-mono text-[13px] whitespace-nowrap">
						{localizedDayjs(getValue<Date>()).format('DD/MM/YYYY hh:mm a')}
					</span>
				),
			},
			{
				id: 'actions',
				header: () => null,
				size: 84,
				enableHiding: false,
				meta: { pin: 'right', align: 'center' },
				cell: ({ row }) => (
					<Link to={`/properties/${row.original.property?.id}`}>
						<Button variant="outline" size="icon" className="size-9.5">
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
						order: sorter.sort,
						order_by: sorter.sort_by,
						has_prev_page: data?.meta?.has_prev_page ?? false,
						has_next_page: data?.meta?.has_next_page ?? false,
					}}
					empty={{
						message: 'No properties found',
						description:
							"You haven't added any properties yet. Properties are the top level of your portfolio.",
						learnMoreUrl: `${ASSET_MANAGEMENT_GUIDE_URL}#what-is-a-property`,
					}}
				/>
			</div>
		</main>
	)
}
