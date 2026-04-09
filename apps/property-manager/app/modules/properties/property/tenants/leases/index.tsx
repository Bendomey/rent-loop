import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRight, History, ScrollText } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PropertyTenantLeasesController } from './controller'
import { useGetPropertyLeases } from '~/api/leases'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { getPaymentFrequencyPeriodLabel } from '~/lib/properties.utils'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

function getLeaseStatusLabel(status: Lease['status']) {
	switch (status) {
		case 'Lease.Status.Pending':
			return 'Pending'
		case 'Lease.Status.Active':
			return 'Active'
		case 'Lease.Status.Completed':
			return 'Completed'
		case 'Lease.Status.Cancelled':
			return 'Cancelled'
		case 'Lease.Status.Terminated':
			return 'Terminated'
		default:
			return status
	}
}

function getLeaseStatusClass(status: Lease['status']) {
	switch (status) {
		case 'Lease.Status.Pending':
			return 'bg-yellow-500 text-white'
		case 'Lease.Status.Active':
			return 'bg-teal-500 text-white'
		case 'Lease.Status.Completed':
			return 'bg-blue-500 text-white'
		case 'Lease.Status.Cancelled':
			return 'bg-zinc-400 text-white'
		case 'Lease.Status.Terminated':
			return 'bg-rose-500 text-white'
		default:
			return ''
	}
}

export function PropertyTenantLeasesModule() {
	const [searchParams] = useSearchParams()
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()

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
			sorter: { sort: 'desc', sort_by: 'created_at' },
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
				accessorKey: 'tenant',
				header: 'Tenant',
				cell: ({ row }) => {
					const tenant = row.original.tenant
					return (
						<div className="flex min-w-32 flex-col items-start gap-1">
							<Link
								to={`/properties/${propertyId}/tenants/all/${tenant?.id}`}
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
		<div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
			<div className="space-y-1">
				<TypographyH4>Leases</TypographyH4>
				<TypographyMuted>
					All active and historical leases for this property.
				</TypographyMuted>
			</div>

			<PropertyTenantLeasesController isLoading={isLoading} refetch={refetch} />

			{/* Entry point for bulk onboard — show when the list is empty */}
			{!isPending && data?.rows?.length === 0 && (
				<Card className="border-dashed shadow-none">
					<CardContent className="flex items-center justify-between py-5">
						<div className="flex items-center gap-3">
							<History className="h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" />
							<div>
								<p className="text-sm font-semibold">Have existing tenants?</p>
								<p className="text-muted-foreground text-sm">
									Quickly onboard all your current tenants and their leases.
								</p>
							</div>
						</div>
						<Link to={`/properties/${propertyId}/tenants/leases/bulk-onboard`}>
							<Button variant="outline" size="sm">
								Get started <ArrowRight className="ml-1 h-4 w-4" />
							</Button>
						</Link>
					</CardContent>
				</Card>
			)}

			<div className="bg-background space-y-4 rounded-lg border p-3 sm:p-5">
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
								'Approved tenant applications will appear here as active leases.',
						}}
					/>
				</div>
			</div>
		</div>
	)
}
