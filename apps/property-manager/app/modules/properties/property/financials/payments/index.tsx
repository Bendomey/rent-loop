import type { ColumnDef } from '@tanstack/react-table'
import {
	CircleCheck,
	CircleDollarSign,
	CircleX,
	EllipsisVertical,
	Pencil,
	Receipt,
	Send,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { RentPaymentSectionCards } from './components/cards'
import { PropertyFinancialsRentPaymentController } from './controller'
import { useGetInvoices } from '~/api/invoices'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { formatAmount } from '~/lib/format-amount'
import {
	getInvoiceContextTypeLabel,
	getInvoiceStatusLabel,
} from '~/lib/invoice'
import { useProperty } from '~/providers/property-provider'

export function PropertyFinancialsPaymentsModule() {
	const [searchParams] = useSearchParams()
	const { clientUserProperty } = useProperty()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const payer_type = searchParams.get('payer_type') ?? undefined
	const payee_type = searchParams.get('payee_type') ?? undefined
	const status = searchParams.get('status') ?? undefined

	const { data, isPending, isRefetching, error, refetch } = useGetInvoices({
		filters: { status: status, payer_type: payer_type, payee_type: payee_type },
		pagination: { page, per },
		sorter: { sort: 'desc', sort_by: 'created_at' },
		search: {
			query: searchParams.get('query') ?? undefined,
			fields: ['end_date', 'payer_tenant_id'],
		},
	})
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
								to={`/properties/${clientUserProperty?.property_id}/financials/payments/${row.original.id}`}
								aria-label={`View details for application`}
							>
								<span className="truncate text-xs text-blue-600 hover:underline">
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
					<span className="truncate text-xs font-semibold text-zinc-800">
						{formatAmount(row.original.total_amount) ?? 'N/A'}
					</span>
				),
			},
			{
				accessorKey: 'context_type',
				header: 'Type',
				cell: ({ getValue }) => (
					<span className="truncate text-xs text-zinc-600">
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
							<span className="truncate text-xs text-zinc-600">
								{date ? localizedDayjs(date).format('DD/MM/YYYY hh:mm a') : '—'}
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
						<span className="truncate text-xs text-zinc-600">
							{localizedDayjs(getValue<Date>()).format('DD/MM/YYYY hh:mm a')}
						</span>
					</div>
				),
			},
			{
				id: 'actions',
				cell: ({ row }) => {
					return (
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

							<DropdownMenuContent align="end" className="32">
								<Link
									to={`/properties/${clientUserProperty?.property?.id}/financials/payments/${row.original.id}`}
								>
									<DropdownMenuItem>View</DropdownMenuItem>
								</Link>
								<DropdownMenuSeparator />
							</DropdownMenuContent>
						</DropdownMenu>
					)
				},
			},
		]
	}, [clientUserProperty])

	return (
		<div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
			<div className="space-y-1">
				<TypographyH4>Manage Payments</TypographyH4>
				<TypographyMuted>
					Monitor tenant payments, track statuses, and manage overdue balances
					efficiently.
				</TypographyMuted>
			</div>

			{/* Summary Cards */}
			<section className="mb-6">
				<RentPaymentSectionCards />
			</section>

			<div className="bg-background space-y-4 rounded-lg border p-3 sm:p-5">
				<PropertyFinancialsRentPaymentController
					isLoading={isLoading}
					refetch={refetch}
				/>
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
