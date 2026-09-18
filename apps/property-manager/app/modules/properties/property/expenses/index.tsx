import type { ColumnDef } from '@tanstack/react-table'
import { Receipt } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PropertyExpenseAnalyticsCards } from './components/cards'
import { CreateExpenseDialog } from './components/create-expense-dialog'
import { PropertyExpensesController } from './controller'
import { useGetPropertyExpenses } from '~/api/expenses'
import { DataTable, useDataTableSort } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { formatAmount } from '~/lib/format-amount'
import { getInvoiceStatusLabel } from '~/lib/invoice'
import { safeString, toFirstUpperCase } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

/**
 * Fields the API may order by. `order_by` reaches the backend's ORDER BY
 * clause, so only these — never a raw URL value — are forwarded.
 */
const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
	OUTSTANDING: 'Outstanding',
	PARTIALLY_SETTLED: 'Part settled',
	SETTLED: 'Settled',
	VOIDED: 'Voided',
}

const EXPENSE_STATUS_CLASSES: Record<ExpenseStatus, string> = {
	OUTSTANDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
	PARTIALLY_SETTLED: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
	SETTLED: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
	VOIDED: 'bg-destructive/10 text-destructive',
}

const SORTABLE_FIELDS = [
	'expenses.code',
	'expenses.description',
	'expenses.context_type',
	'expenses.amount',
	'expenses.created_at',
]

export function PropertyExpensesModule() {
	const [searchParams] = useSearchParams()
	const sorter = useDataTableSort(SORTABLE_FIELDS, {
		sort_by: 'expenses.created_at',
		sort: 'desc',
	})
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()

	const propertyId = safeString(clientUserProperty?.property_id)

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const contextType = searchParams.get('context_type') as
		| 'MAINTENANCE'
		| 'GENERAL'
		| null
	const category = searchParams.get('category') as ExpenseCategory | null

	const { data, isPending, isRefetching, error, refetch } =
		useGetPropertyExpenses(safeString(clientUser?.client_id), propertyId, {
			filters: {
				...(contextType && { context_type: contextType }),
				...(category && { category }),
			},
			pagination: { page, per },
			sorter,
			populate: ['Invoices'],
		})

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<Expense>[] = useMemo(() => {
		return [
			{
				accessorKey: 'code',
				header: 'Expense #',
				enableSorting: true,
				meta: { sortKey: 'expenses.code' },
				cell: ({ row }) => (
					<span className="flex flex-row items-center gap-2 truncate text-xs font-medium">
						<Receipt className="text-muted-foreground size-5" />
						{row.original.code}
					</span>
				),
			},
			{
				accessorKey: 'description',
				header: 'Description',
				enableSorting: true,
				meta: { sortKey: 'expenses.description' },
				cell: ({ getValue }) => (
					<span className="truncate text-xs text-zinc-700 dark:text-zinc-300">
						{getValue<string>()}
					</span>
				),
			},
			{
				accessorKey: 'vendor_name',
				header: 'Vendor',
				cell: ({ row }) =>
					row.original.vendor_name ? (
						<span className="truncate text-xs text-zinc-700 dark:text-zinc-300">
							{row.original.vendor_name}
						</span>
					) : (
						// Migrated rows genuinely have no vendor. Nothing to fix here —
						// they are already invoiced and paid.
						<span className="text-muted-foreground truncate text-xs">
							No vendor recorded
						</span>
					),
			},
			{
				accessorKey: 'category',
				header: 'Category',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="px-1.5 py-0 text-[10px]">
						{toFirstUpperCase(getValue<string>().toLowerCase())}
					</Badge>
				),
			},
			{
				accessorKey: 'context_type',
				header: 'Context',
				enableSorting: true,
				meta: { sortKey: 'expenses.context_type' },
				cell: ({ row }) =>
					row.original.context_type === 'MAINTENANCE' &&
					row.original.maintenance_request_id ? (
						<Link
							to={`/properties/${propertyId}/activities/maintenance-requests/${row.original.maintenance_request_id}`}
							className="text-xs text-blue-600 hover:underline dark:text-blue-500"
						>
							Maintenance
						</Link>
					) : (
						<span className="truncate text-xs text-zinc-700 dark:text-zinc-300">
							{row.original.context_type === 'MAINTENANCE'
								? 'Maintenance'
								: 'General'}
						</span>
					),
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ row }) => (
					<Badge
						variant="outline"
						className={`px-1.5 py-0 text-[10px] ${EXPENSE_STATUS_CLASSES[row.original.status]}`}
					>
						{EXPENSE_STATUS_LABELS[row.original.status]}
					</Badge>
				),
			},
			{
				accessorKey: 'amount',
				header: 'Amount',
				enableSorting: true,
				meta: { sortKey: 'expenses.amount' },
				cell: ({ getValue, row }) => (
					<span className="truncate text-xs font-semibold text-zinc-800 dark:text-white">
						{formatAmount(getValue<number>() / 100, row.original.currency)}
					</span>
				),
			},
			{
				accessorKey: 'invoice_id',
				header: 'Bill',
				cell: ({ row }) => {
					const invoice = row.original.invoice
					if (!invoice)
						return (
							<Badge
								variant="outline"
								className="border-muted-foreground/30 px-1.5 py-0 text-[10px]"
							>
								No bill
							</Badge>
						)
					return (
						<Link
							to={`/properties/${propertyId}/financials/invoices/${invoice.id}`}
							className="hover:underline"
						>
							<Badge
								variant="outline"
								className="px-1.5 py-0 text-[10px] text-blue-600 dark:text-blue-500"
							>
								{invoice.code} · {getInvoiceStatusLabel(invoice.status)}
							</Badge>
						</Link>
					)
				},
			},
			{
				accessorKey: 'created_at',
				header: 'Created On',
				enableSorting: true,
				meta: { sortKey: 'expenses.created_at' },
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
					What this property costs to run — money owed to vendors, and money
					already paid out.
				</TypographyMuted>
			</div>

			<PropertyExpenseAnalyticsCards propertyId={propertyId} />

			<div className="flex justify-end">
				<CreateExpenseDialog propertyId={propertyId} />
			</div>

			<PropertyExpensesController isLoading={isLoading} refetch={refetch} />

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
							'Record what this property costs to run, or log a cost on a maintenance request.',
					}}
				/>
			</div>
		</div>
	)
}
