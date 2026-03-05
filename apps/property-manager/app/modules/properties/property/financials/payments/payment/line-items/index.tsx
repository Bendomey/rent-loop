import type { ColumnDef } from '@tanstack/react-table'
import { Building, EllipsisVertical } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { TenantPaymentSectionCards } from './cards'
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
import { localizedDayjs } from '~/lib/date'
import { formatAmount } from '~/lib/format-amount'
import { useProperty } from '~/providers/property-provider'

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
	const { clientUserProperty } = useProperty()

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
							<Link
								to={`/properties/${clientUserProperty?.property_id}/financials/payments/${row.original.id}`}
								aria-label={`View details for application`}
							>
								<span className="truncate text-xs text-blue-600 hover:underline">
									{row.original.label}
								</span>
							</Link>
						</div>
					)
				},
				enableHiding: false,
			},
			{
				accessorKey: 'unit_amount',
				header: 'Unit Amount x Quantity',
				cell: ({ row }) => (
					<span className="truncate text-xs font-semibold text-zinc-600">
						{formatAmount(row.original.unit_amount)} x {row.original.quantity}
					</span>
				),
			},
			{
				accessorKey: 'total_amount',
				header: 'Total Amount',
				cell: ({ row }) => (
					<span className="truncate text-xs font-semibold text-zinc-800">
						{formatAmount(row.original.total_amount) ?? 'N/A'}
					</span>
				),
			},
			{
				accessorKey: 'category',
				header: 'Category',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						<span className="truncate text-xs text-zinc-600">
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
		<div className="mx-auto my-2 flex flex-col gap-4 sm:gap-6">
			<div className="space-y-1">
				<TypographyH4>All Payments</TypographyH4>
				<TypographyMuted>
					Monitor invoice payments, and manage overdue balances efficiently.
				</TypographyMuted>
			</div>

			<TenantPaymentSectionCards data={data} />

			<div className="bg-background space-y-5 rounded-lg border p-3 sm:p-5">
				<div className="h-full w-full">
					<DataTable
						columns={columns}
						isLoading={isLoading}
						refetch={refetch}
						error={error ? 'Failed to load payments.' : undefined}
						dataResponse={{
							rows: data?.line_items || [],
							total: data?.line_items?.length ?? 0,
							page: 1,
							page_size: 1000, // show all since pagination is done
							order: 'desc',
							order_by: 'created_at',
							has_prev_page: false,
							has_next_page: false,
						}}
						empty={{
							message: 'No invoice items found',
							description:
								"There is currently no data to display.",
						}}
					/>
				</div>
			</div>
		</div>
	)
}
