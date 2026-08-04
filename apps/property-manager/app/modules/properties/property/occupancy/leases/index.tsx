import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRight, History, ScrollText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PropertyTenantLeasesController } from './controller'
import { StartLeaseDialog } from './lease/components/start-lease-dialog'
import { useGetPropertyLeases } from '~/api/leases'
import { DataTable, useDataTableSort } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { getLeaseDisplayStatus } from '~/lib/lease.utils'
import { getPaymentFrequencyPeriodLabel } from '~/lib/properties.utils'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

/**
 * Fields the API may order by. `order_by` reaches the backend's ORDER BY
 * clause, so only these — never a raw URL value — are forwarded.
 */
const SORTABLE_FIELDS = [
	'leases.status',
	'leases.rent_fee',
	'leases.stay_duration',
	'leases.created_at',
]

export function PropertyTenantLeasesModule() {
	const [searchParams] = useSearchParams()
	const sorter = useDataTableSort(SORTABLE_FIELDS, {
		sort_by: 'leases.created_at',
		sort: 'desc',
	})
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const [startLeaseTarget, setStartLeaseTarget] = useState<Lease | null>(null)

	const propertyId = clientUserProperty?.property_id ?? ''

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const status = searchParams.get('status') ?? undefined
	const unitIds = searchParams.getAll('unit_ids')
	const query = searchParams.get('query') ?? undefined

	const { data, isPending, isRefetching, error, refetch } =
		useGetPropertyLeases(safeString(clientUser?.client_id), propertyId, {
			filters: {
				status,
				unit_ids: unitIds.length > 0 ? unitIds : undefined,
			},
			pagination: { page, per },
			populate: ['Tenant', 'Unit'],
			sorter,
			search: {
				query,
				fields: ['code'],
			},
		})

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
							to={`/properties/${propertyId}/occupancy/leases/${row.original.id}`}
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
				accessorKey: 'tenant',
				header: 'Tenant',
				cell: ({ row }) => {
					const tenant = row.original.tenant
					return (
						<div className="flex min-w-32 flex-col items-start gap-1">
							<Link
								to={`/properties/${propertyId}/occupancy/tenants/${tenant?.id}`}
								aria-label={`View tenant ${tenant?.first_name}`}
							>
								<span className="truncate text-xs text-blue-600 hover:underline dark:text-blue-400">
									{tenant ? `${tenant.first_name} ${tenant.last_name}` : '—'}
								</span>
							</Link>
						</div>
					)
				},
				enableHiding: false,
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
			},
			{
				accessorKey: 'status',
				header: 'Status',
				enableSorting: true,
				meta: { sortKey: 'leases.status' },
				cell: ({ row }) => {
					const lease = row.original
					const display = getLeaseDisplayStatus(lease)

					const badge = (
						<Badge variant="outline" className={`px-1.5 ${display.className}`}>
							{display.label}
						</Badge>
					)

					if (!lease.move_out_date) return badge

					return (
						<Tooltip>
							<TooltipTrigger>{badge}</TooltipTrigger>
							<TooltipContent>
								Move-out:{' '}
								{localizedDayjs(lease.move_out_date).format('MMM D, YYYY')}
							</TooltipContent>
						</Tooltip>
					)
				},
			},
			{
				accessorKey: 'rent_fee',
				header: 'Rent',
				enableSorting: true,
				meta: { sortKey: 'leases.rent_fee' },
				cell: ({ getValue, row }) => (
					<span className="truncate text-xs font-semibold">
						{formatAmount(
							convertPesewasToCedis(getValue<number>()),
							row.original.rent_fee_currency,
						)}
					</span>
				),
			},
			{
				accessorKey: 'stay_duration',
				header: 'Duration',
				enableSorting: true,
				meta: { sortKey: 'leases.stay_duration' },
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
				id: 'actions',
				header: () => null,
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-2">
						{row.original.status === 'Lease.Status.Pending' ? (
							<Button
								size="sm"
								className="h-7 bg-teal-600 text-xs text-white hover:bg-teal-700 dark:bg-teal-700 hover:dark:bg-teal-800"
								onClick={() => setStartLeaseTarget(row.original)}
							>
								Start lease
							</Button>
						) : null}
						<Link
							to={`/properties/${propertyId}/occupancy/leases/${row.original.id}`}
						>
							<Button size="sm" variant="outline" className="h-7 text-xs">
								View
							</Button>
						</Link>
					</div>
				),
			},
		],
		[propertyId, setStartLeaseTarget],
	)

	return (
		<div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
			{startLeaseTarget ? (
				<StartLeaseDialog
					lease={startLeaseTarget}
					propertyId={propertyId}
					opened={!!startLeaseTarget}
					setOpened={(open) => {
						if (!open) setStartLeaseTarget(null)
					}}
				/>
			) : null}
			<div className="space-y-1">
				<TypographyH4>Rental Agreements</TypographyH4>
				<TypographyMuted>
					All active and historical rental agreements for this property.
				</TypographyMuted>
			</div>

			<PropertyTenantLeasesController isLoading={isLoading} refetch={refetch} />

			{/* Big banner — only when there are no rental agreements yet */}
			{!isPending && data?.rows?.length === 0 && (
				<Card className="border-dashed shadow-none">
					<CardContent className="flex items-center justify-between py-5">
						<div className="flex items-center gap-3">
							<History className="h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" />
							<div>
								<p className="text-sm font-semibold">Have existing tenants?</p>
								<p className="text-muted-foreground text-sm">
									Quickly onboard your current tenants and their rental
									agreements.
								</p>
							</div>
						</div>
						<Link
							to={`/properties/${propertyId}/occupancy/leases/bulk-onboard`}
						>
							<Button variant="outline" size="sm">
								Add tenants <ArrowRight className="ml-1 h-4 w-4" />
							</Button>
						</Link>
					</CardContent>
				</Card>
			)}

			<div className="h-full w-full">
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
						description:
							'Approved lease applications will appear here as active leases.',
					}}
				/>
			</div>
		</div>
	)
}
