import type { ColumnDef } from '@tanstack/react-table'
import { CalendarDays } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PropertyBookingsController } from './controller'
import { useGetPropertyBookings } from '~/api/bookings'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
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

export function PropertyBookingsModule() {
	const [searchParams] = useSearchParams()
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()

	const propertyId = clientUserProperty?.property_id ?? ''
	const clientId = safeString(clientUser?.client_id)

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const status = (searchParams.get('status') as BookingStatus) ?? undefined
	const unit_id = searchParams.get('unit_id') ?? undefined

	const { data, isPending, isRefetching, error, refetch } =
		useGetPropertyBookings(clientId, propertyId, {
			filters: { status, unit_id },
			pagination: { page, per },
			populate: ['Tenant', 'Unit'],
			sorter: { sort: 'desc', sort_by: 'created_at' },
		})

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
				accessorKey: 'tenant',
				header: 'Guest',
				cell: ({ row }) => {
					const t = row.original.tenant
					return (
						<span className="text-xs">
							{t ? `${t.first_name} ${t.last_name}` : '—'}
						</span>
					)
				},
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
				accessorKey: 'rate',
				header: 'Rate',
				cell: ({ getValue }) => (
					<span className="text-xs font-semibold">
						{formatAmount(convertPesewasToCedis(getValue<number>()))}
					</span>
				),
			},
		],
		[propertyId],
	)

	return (
		<div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
			<div className="space-y-1">
				<TypographyH4>Bookings</TypographyH4>
				<TypographyMuted>All bookings for this property.</TypographyMuted>
			</div>

			<PropertyBookingsController isLoading={isLoading} refetch={refetch} />

			<div className="bg-background space-y-4 rounded-lg border p-3 sm:p-5">
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
						message: 'No bookings yet',
						description:
							'Create a booking or share the public booking link with your guests.',
					}}
				/>
			</div>
		</div>
	)
}
