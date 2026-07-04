import type { ColumnDef } from '@tanstack/react-table'
import { CalendarDays } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useGetTenantBookings } from '~/api/bookings'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

type BookingStatusConfig = {
	label: string
	className: string
}

const STATUS_CONFIG: Record<BookingStatus, BookingStatusConfig> = {
	PENDING: { label: 'Pending', className: 'bg-yellow-500 text-white' },
	CONFIRMED: { label: 'Confirmed', className: 'bg-teal-500 text-white' },
	CHECKED_IN: { label: 'Checked In', className: 'bg-blue-500 text-white' },
	COMPLETED: { label: 'Completed', className: 'bg-zinc-400 text-white' },
	CANCELLED: { label: 'Cancelled', className: 'bg-rose-500 text-white' },
}

export function TenantBookingsModule() {
	const [searchParams] = useSearchParams()
	const { clientUser } = useClient()
	const { clientUserProperty } = useProperty()
	const { tenantId } = useParams<{ tenantId: string }>()

	const propertyId = safeString(clientUserProperty?.property_id)

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const status = (searchParams.get('status') as BookingStatus) ?? undefined

	const { data, isPending, isRefetching, error, refetch } =
		useGetTenantBookings(
			safeString(clientUser?.client_id),
			propertyId,
			safeString(tenantId),
			{
				filters: { status },
				pagination: { page, per },
				sorter: { sort: 'desc', sort_by: 'created_at' },
			},
		)

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<Booking>[] = useMemo(
		() => [
			{
				id: 'code',
				header: 'Code',
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<CalendarDays className="text-muted-foreground size-4" />
						<Link
							to={`/properties/${propertyId}/occupancy/bookings/${row.original.id}`}
							className="text-xs text-blue-600 hover:underline dark:text-blue-400"
						>
							{row.original.code}
						</Link>
					</div>
				),
			},
			{
				accessorKey: 'unit',
				header: 'Unit',
				cell: ({ row }) => (
					<span className="text-xs">{row.original.unit?.name ?? '—'}</span>
				),
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ getValue }) => {
					const s = getValue<BookingStatus>()
					const cfg = STATUS_CONFIG[s]
					return (
						<Badge variant="outline" className={`px-1.5 ${cfg.className}`}>
							{cfg.label}
						</Badge>
					)
				},
			},
			{
				accessorKey: 'check_in_date',
				header: 'Check In',
				cell: ({ getValue }) => (
					<span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
						{localizedDayjs(getValue<Date>()).format('DD/MM/YYYY')}
					</span>
				),
			},
			{
				accessorKey: 'check_out_date',
				header: 'Check Out',
				cell: ({ getValue }) => (
					<span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
						{localizedDayjs(getValue<Date>()).format('DD/MM/YYYY')}
					</span>
				),
			},
			{
				accessorKey: 'created_at',
				header: 'Created On',
				cell: ({ getValue }) => (
					<div className="min-w-32">
						<span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
							{localizedDayjs(getValue<Date>()).format('DD/MM/YYYY hh:mm a')}
						</span>
					</div>
				),
			},
		],
		[propertyId],
	)

	return (
		<div className="mx-auto my-2 flex flex-col gap-4 sm:gap-6">
			<div className="space-y-1">
				<TypographyH4>Tenant Bookings</TypographyH4>
				<TypographyMuted>
					Track this tenant&apos;s booking history for your property.
				</TypographyMuted>
			</div>
			<div className="mt-3 flex flex-col gap-4">
				<DataTable
					columns={columns}
					isLoading={isLoading}
					refetch={refetch}
					error={error ? 'Failed to load bookings.' : undefined}
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
						message: 'No bookings found',
						description: "This tenant's booking history will appear here.",
					}}
				/>
			</div>
		</div>
	)
}
