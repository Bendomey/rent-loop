import type { ColumnDef } from '@tanstack/react-table'
import { ScrollText } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useGetTenantLeases } from '~/api/leases'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { getLeaseStatusClass, getLeaseStatusLabel } from '~/lib/lease.utils'
import { getPaymentFrequencyPeriodLabel } from '~/lib/properties.utils'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

export function TenantLeasesModule() {
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
	const status = searchParams.get('status') ?? undefined

	const { data, isPending, isRefetching, error, refetch } = useGetTenantLeases(
		safeString(clientUser?.client_id),
		propertyId,
		safeString(tenantId),
		{
			filters: { status },
			pagination: { page, per },
			populate: ['Unit'],
			sorter: { sort: 'desc', sort_by: 'created_at' },
		},
	)

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<Lease>[] = useMemo(
		() => [
			{
				id: 'icon',
				header: () => null,
				cell: ({ row }) => (
					<div className="flex items-center space-x-2">
						<ScrollText className="text-muted-foreground size-5" />
						<Link
							to={`/properties/${propertyId}/tenants/leases/${row.original.id}`}
							aria-label={`View lease ${row.original.code}`}
						>
							<span className="truncate text-xs text-blue-600 hover:underline dark:text-blue-400">
								{row.original.code}
							</span>
						</Link>
					</div>
				),
			},
			{
				accessorKey: 'unit',
				header: 'Unit',
				cell: ({ row }) => {
					const unit = row.original.unit
					return (
						<div className="flex min-w-32 flex-col items-start gap-1">
							<Link
								to={`/properties/${propertyId}/assets/units/${unit?.id}`}
								aria-label={`View unit ${unit?.name}`}
							>
								<span className="truncate text-xs text-blue-600 hover:underline dark:text-blue-400">
									{unit?.name ?? '—'}
								</span>
							</Link>
						</div>
					)
				},
				enableHiding: false,
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ getValue }) => {
					const status = getValue<Lease['status']>()
					return (
						<Badge
							variant="outline"
							className={`px-1.5 ${getLeaseStatusClass(status)}`}
						>
							{getLeaseStatusLabel(status)}
						</Badge>
					)
				},
			},
			{
				accessorKey: 'rent_fee',
				header: 'Rent',
				cell: ({ getValue }) => (
					<span className="truncate text-xs font-semibold">
						{formatAmount(convertPesewasToCedis(getValue<number>()))}
					</span>
				),
			},
			{
				accessorKey: 'stay_duration',
				header: 'Duration',
				cell: ({ row }) => (
					<span className="truncate text-xs text-zinc-600 dark:text-white">
						{row.original.stay_duration}{' '}
						{getPaymentFrequencyPeriodLabel(
							row.original.stay_duration_frequency,
							row.original.stay_duration ?? 1,
						)}
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
				<TypographyH4>Tenant Leases</TypographyH4>
				<TypographyMuted>
					Track and manage tenant leases for your property efficiently.
				</TypographyMuted>
			</div>
			<div className="mt-3 flex flex-col gap-4">
				<DataTable
					columns={columns}
					isLoading={isLoading}
					refetch={refetch}
					error={error ? 'Failed to load leases.' : undefined}
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
						message: 'No leases found',
						description: "This tenant's lease history will appear here.",
					}}
				/>
			</div>
		</div>
	)
}
