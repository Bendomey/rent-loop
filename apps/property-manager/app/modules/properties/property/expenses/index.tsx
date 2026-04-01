import type { ColumnDef } from '@tanstack/react-table'
import { Receipt } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PropertyExpenseAnalyticsCards } from './components/cards'
import { PropertyExpensesController } from './controller'
import { useGetPropertyExpenses } from '~/api/expenses'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { formatAmount } from '~/lib/format-amount'
import { getInvoiceStatusLabel } from '~/lib/invoice'
import { safeString } from '~/lib/strings'
import { useProperty } from '~/providers/property-provider'

export function PropertyExpensesModule() {
	const [searchParams] = useSearchParams()
	const { clientUserProperty } = useProperty()

	const propertyId = safeString(clientUserProperty?.property_id)

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const contextType = searchParams.get('context_type') as
		| 'LEASE'
		| 'MAINTENANCE'
		| null

	const { data, isPending, isRefetching, error, refetch } =
		useGetPropertyExpenses(propertyId, {
			filters: contextType ? { context_type: contextType } : {},
			pagination: { page, per },
			sorter: { sort: 'desc', sort_by: 'created_at' },
			populate: ['Invoices'],
		})

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<Expense>[] = useMemo(() => {
		return [
			{
				id: 'icon',
				header: () => null,
				cell: () => <Receipt className="text-muted-foreground size-5" />,
			},
			{
				accessorKey: 'code',
				header: 'Expense #',
				cell: ({ row }) => (
					<span className="truncate text-xs font-medium">
						{row.original.code}
					</span>
				),
			},
			{
				accessorKey: 'description',
				header: 'Description',
				cell: ({ getValue }) => (
					<span className="truncate text-xs text-zinc-700 dark:text-zinc-300">
						{getValue<string>()}
					</span>
				),
			},
			{
				accessorKey: 'context_type',
				header: 'Type',
				cell: ({ row }) => {
					const isLease =
						row.original.context_type === 'LEASE' &&
						row.original.context_lease_id
					return isLease ? (
						<Link
							to={`/properties/${propertyId}/tenants/leases/${row.original.context_lease_id}`}
							className="text-xs text-blue-600 hover:underline dark:text-blue-500"
						>
							Lease
						</Link>
					) : (
						<Link
							to={`/properties/${propertyId}/activities/maintenance-requests/${row.original.context_maintenance_request_id}`}
							className="text-xs text-blue-600 hover:underline dark:text-blue-500"
						>
							Maintenance
						</Link>
					)
				},
			},
			{
				accessorKey: 'amount',
				header: 'Amount',
				cell: ({ getValue }) => (
					<span className="truncate text-xs font-semibold text-zinc-800 dark:text-white">
						{formatAmount(getValue<number>() / 100)}
					</span>
				),
			},
			{
				accessorKey: 'invoices',
				header: 'Invoices',
				cell: ({ row }) => {
					const invoices = row.original.invoices
					if (!invoices?.length)
						return (
							<Badge
								variant="outline"
								className="border-muted-foreground/30 px-1.5 py-0 text-[10px]"
							>
								Not invoiced
							</Badge>
						)
					return (
						<div className="flex flex-wrap gap-1">
							{invoices.map((inv) => (
								<Link
									key={inv.id}
									to={`/properties/${propertyId}/financials/invoices/${inv.id}`}
									className="hover:underline"
								>
									<Badge
										variant="outline"
										className={`px-1.5 py-0 text-[10px] ${
											inv.status === 'PAID'
												? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400'
												: inv.status === 'ISSUED'
													? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
													: inv.status === 'PARTIALLY_PAID'
														? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
														: inv.status === 'VOID'
															? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400'
															: 'border-muted-foreground/30 text-muted-foreground'
										}`}
									>
										{inv.code} · {getInvoiceStatusLabel(inv.status)}
									</Badge>
								</Link>
							))}
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
	}, [propertyId])

	return (
		<div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
			<div className="space-y-1">
				<TypographyH4>Expenses</TypographyH4>
				<TypographyMuted>
					All expenses across lease and maintenance contexts for this property.
				</TypographyMuted>
			</div>

			<PropertyExpenseAnalyticsCards propertyId={propertyId} />

			<PropertyExpensesController isLoading={isLoading} refetch={refetch} />

			<div className="bg-background space-y-4 rounded-lg border p-3 sm:p-5">
				<div className="h-full w-full">
					<DataTable
						columns={columns}
						isLoading={isLoading}
						refetch={refetch}
						error={error ? 'Failed to load expenses.' : undefined}
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
							message: 'No expenses found',
							description:
								'Expenses will appear here once created from leases or maintenance requests.',
						}}
					/>
				</div>
			</div>
		</div>
	)
}
