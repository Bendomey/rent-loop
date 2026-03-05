import type { ColumnDef } from '@tanstack/react-table'
import {
	CircleAlert,
	CircleCheck,
	CircleHelp,
	CircleX,
	Clock,
	Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import { TenantPaymentSectionCards } from './cards'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import { formatAmount } from '~/lib/format-amount'
import { getPaymentStatusLabel } from '~/lib/payment.utils'

interface Props {
	data: Invoice
	isLoading?: boolean
	error?: string
	refetch?: () => void
}

export function PropertyFinancialsPaymentItemsModule({
	data,
	isLoading,
	error,
	refetch,
}: Props) {
	const columns: ColumnDef<Payment>[] = useMemo(() => {
		return [
			{
				id: 'id',
				header: () => null,
				cell: () => {
					return <Wallet />
				},
			},
			{
				accessorKey: 'reference',
				header: 'Reference',
				cell: ({ row }) => {
					return (
						<div className="">
							<span className="truncate text-xs text-blue-600">
								{row.original.reference}
							</span>
						</div>
					)
				},
				enableHiding: false,
			},
			{
				accessorKey: 'amount',
				header: 'Amount',
				cell: ({ row }) => (
					<span className="truncate text-xs font-semibold text-zinc-600">
						{formatAmount(row.original.amount)}
					</span>
				),
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						{getValue<string>() === 'PENDING' ? (
							<Clock className="text-gray-500" />
						) : getValue<string>() === 'SUCCESSFUL' ? (
							<CircleCheck className="text-green-600" />
						) : getValue<string>() === 'FAILED' ? (
							<CircleX className="text-red-600" />
						) : (
							<CircleHelp className="text-gray-400" />
						)}
						{getPaymentStatusLabel(getValue<Payment['status']>())}
					</Badge>
				),
			},
			{
				accessorKey: 'provider',
				header: 'Provider',
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
		]
	}, [])

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
							rows: data?.payments || [],
							total: data?.payments?.length ?? 0,
							page: 1,
							page_size: 1000, // show all
							order: 'desc',
							order_by: 'created_at',
							has_prev_page: false,
							has_next_page: false,
						}}
						empty={{
							message: 'No payments found',
							description: 'There is currently no data to display.',
						}}
					/>
				</div>
			</div>
		</div>
	)
}
