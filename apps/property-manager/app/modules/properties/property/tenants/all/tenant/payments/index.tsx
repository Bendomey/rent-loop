import type { ColumnDef } from '@tanstack/react-table'
import {
	CircleCheck,
	CircleDollarSign,
	CircleX,
	Pencil,
	Receipt,
	Send,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { TenantPaymentSectionCards } from './cards'
import { TenantPaymentController } from './controller'
import { useGetInvoices } from '~/api/invoices'
import { useGetTenantLeases } from '~/api/leases'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import {
	getInvoiceContextTypeLabel,
	getInvoiceStatusLabel,
} from '~/lib/invoice'
import { safeString } from '~/lib/strings'
import { useProperty } from '~/providers/property-provider'

export function TenantPaymentsModule() {
	const [searchParams] = useSearchParams()
	const { clientUserProperty } = useProperty()
	const { tenantId } = useParams()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const status = searchParams.get('status') ?? undefined

	const { data: leasesData } = useGetTenantLeases(
		safeString(clientUserProperty?.property_id),
		safeString(tenantId),
		{ filters: {}, pagination: { page: 1, per: 1 } },
	)
	const leaseId = leasesData?.rows?.[0]?.id

	const { data, isPending, isRefetching, error, refetch } = useGetInvoices(
		safeString(clientUserProperty?.property_id),
		{
			filters: {
				status: status,
				payer_lease_id: leaseId,
			},
			pagination: { page, per },
			sorter: { sort: 'desc', sort_by: 'created_at' },
		},
	)

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<Invoice>[] = useMemo(() => {
		return [
			{
				id: 'drag',
				header: () => null,
				cell: () => {
					return <Receipt className="text-muted-foreground size-5" />
				},
			},
			{
				accessorKey: 'code',
				header: 'Invoice #',
				cell: ({ row }) => {
					return (
						<div className="">
							<Link
								to={`/properties/${clientUserProperty?.property_id}/financials/invoices/${row.original.id}`}
								aria-label={`View details for application`}
							>
								<span className="truncate text-xs text-blue-600 hover:underline dark:text-blue-500">
									{row.original.code}
								</span>
							</Link>
						</div>
					)
				},
				enableHiding: false,
			},
			{
				accessorKey: 'total_amount',
				header: 'Amount',
				cell: ({ row }) => (
					<span className="truncate text-xs font-semibold text-zinc-800 dark:text-white">
						{formatAmount(convertPesewasToCedis(row.original.total_amount)) ??
							'N/A'}
					</span>
				),
			},
			{
				accessorKey: 'context_type',
				header: 'Type',
				cell: ({ getValue }) => (
					<span className="truncate text-xs text-zinc-600 dark:text-white">
						{getInvoiceContextTypeLabel(getValue<Invoice['context_type']>())}
					</span>
				),
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						{getValue<string>() === 'DRAFT' ? (
							<Pencil className="text-slate-600" />
						) : getValue<string>() === 'ISSUED' ? (
							<Send className="text-blue-600" />
						) : getValue<string>() === 'PAID' ? (
							<CircleCheck className="fill-green-600 text-white" />
						) : getValue<string>() === 'PARTIALLY_PAID' ? (
							<CircleDollarSign className="text-yellow-600" />
						) : (
							<CircleX className="fill-red-500 text-white" />
						)}
						{getInvoiceStatusLabel(getValue<Invoice['status']>())}
					</Badge>
				),
			},
			{
				accessorKey: 'due_date',
				header: 'Due Date',
				cell: ({ getValue }) => {
					const date = getValue<Date | null>()
					return (
						<div className="min-w-32">
							<span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
								{date ? localizedDayjs(date).format('LLL') : '—'}
							</span>
						</div>
					)
				},
			},
			{
				accessorKey: 'created_at',
				header: 'Created On',
				cell: ({ getValue }) => (
					<div className="min-w-32">
						<span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
							{localizedDayjs(getValue<Date>()).format('LLL')}
						</span>
					</div>
				),
			},
		]
	}, [clientUserProperty])

	return (
		<div className="mx-auto my-2 flex flex-col gap-4 sm:gap-6">
			<div className="space-y-1">
				<TypographyH4>Tenant Invoices & Payments</TypographyH4>
				<TypographyMuted>
					Monitor tenant payments, track statuses, and manage overdue balances
					efficiently.
				</TypographyMuted>
			</div>

			<TenantPaymentSectionCards />

			<div className="bg-background space-y-5 rounded-lg border p-3 sm:p-5">
				<TenantPaymentController isLoading={isLoading} refetch={refetch} />
				<div className="h-full w-full">
					<DataTable
						columns={columns}
						isLoading={isLoading}
						refetch={refetch}
						error={error ? 'Failed to load payments.' : undefined}
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
							message: 'No payments found',
							description:
								"Try adjusting your search to find what you're looking for.",
						}}
					/>
				</div>
			</div>
		</div>
	)
}
