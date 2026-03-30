import type { ColumnDef } from '@tanstack/react-table'
import { Building } from 'lucide-react'
import { useMemo } from 'react'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface Props {
	data: Invoice
	isLoading?: boolean
	error?: string
	refetch?: () => void
}

export function PropertyFinancialsPaymentLineItemsModule({
	data,
	isLoading,
	error,
	refetch,
}: Props) {

	const columns: ColumnDef<InvoiceLineItem>[] = useMemo(() => {
		return [
			{
				id: 'id',
				header: () => null,
				cell: () => {
					return <Building />
				},
			},
			{
				accessorKey: 'label',
				header: 'Label',
				cell: ({ row }) => {
					return (
						<div className="">
							<span className="text-muted-foreground truncate text-xs font-bold dark:text-white">
								{row.original.label}
							</span>
						</div>
					)
				},
				enableHiding: false,
			},
			{
				accessorKey: 'unit_amount',
				header: 'Unit Amount x Quantity',
				cell: ({ row }) => (
					<span className="truncate text-xs font-semibold text-zinc-600 dark:text-white">
						{formatAmount(convertPesewasToCedis(row.original.unit_amount))} x{' '}
						{row.original.quantity}
					</span>
				),
			},
			{
				accessorKey: 'total_amount',
				header: 'Total Amount',
				cell: ({ row }) => (
					<span className="truncate text-xs font-semibold text-zinc-800 dark:text-white">
						{formatAmount(convertPesewasToCedis(row.original.total_amount)) ??
							'N/A'}
					</span>
				),
			},
			{
				accessorKey: 'category',
				header: 'Category',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						<span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
							{getValue<string>()}
						</span>
					</Badge>
				),
			},

			{
				accessorKey: 'created_at',
				header: 'Payment Date',
				cell: ({ getValue }) => (
					<div className="min-w-32">
						<span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
							{localizedDayjs(getValue<Date>()).format('DD/MM/YYYY hh:mm a')}
						</span>
					</div>
				),
			},
		]
	}, [])

	return (
		<div className="mx-auto my-2 flex flex-col gap-4 sm:gap-6">
			<div className="space-y-1">
				<TypographyH4>All Invoice Items</TypographyH4>
				<TypographyMuted>
					Monitor invoice items, and manage overdue balances efficiently.
				</TypographyMuted>
			</div>

			<div className="bg-background space-y-5 rounded-lg border p-3 sm:p-5">
				<div className="h-full w-full">
					<DataTable
						columns={columns}
						isLoading={isLoading}
						refetch={refetch}
						error={error ? 'Failed to load invoice items.' : undefined}
						dataResponse={{
							rows: data?.line_items || [],
							total: data?.line_items?.length ?? 0,
							page: 1,
							page_size: 1000, // show all
							order: 'desc',
							order_by: 'created_at',
							has_prev_page: false,
							has_next_page: false,
						}}
						empty={{
							message: 'No invoice items found',
							description: 'There is currently no data to display.',
						}}
					/>
				</div>
			</div>
		</div>
	)
}
