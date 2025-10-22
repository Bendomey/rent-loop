import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import {
	CircleCheck,
	EllipsisVertical,
	FileText,
	Loader,
	RotateCw,
} from 'lucide-react'
import { useMemo } from 'react'
import { PropertyBillingController } from './controller'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

export function PropertyBillingSettingsModule() {
	const columns: ColumnDef<BillingInvoice>[] = useMemo(() => {
		return [
			{
				id: 'drag',
				header: () => null,
				cell: () => <FileText className="size-5 text-zinc-500" />,
			},
			{
				accessorKey: 'created_at',
				header: 'Invoice',
				cell: ({ getValue }) => {
					return (
						<div className="min-w-32">
							<span className="truncate text-xs text-zinc-600">
								{dayjs(getValue<Date>()).format('MMMM, YYYY')}
							</span>
						</div>
					)
				},
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						{getValue<BillingInvoice['status']>() ===
						'BillingInvoice.Status.Paid' ? (
							<CircleCheck className="fill-green-600 text-white" />
						) : (
							<Loader className="text-yellow-600" />
						)}
						{getValue<BillingInvoice['status']>() ===
						'BillingInvoice.Status.Pending'
							? 'Pending'
							: 'Paid'}
					</Badge>
				),
			},
			{
				accessorKey: 'amount',
				header: 'Amount',
				cell: ({ getValue }) => (
					<span className="truncate text-xs text-zinc-600">
						{formatAmount(convertPesewasToCedis(getValue<number>()))}
					</span>
				),
			},
			{
				id: 'actions',
				cell: () => (
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
						<DropdownMenuContent align="end" className="w-32">
							<DropdownMenuItem>Pay</DropdownMenuItem>
							<DropdownMenuItem>Download</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				),
			},
		]
	}, [])

	return (
		<main className="space-y-4">
			<div className="flex flex-row items-center justify-between">
				<div>
					<TypographyH4>Manage Billing</TypographyH4>
					<TypographyMuted>
						Billing invoices will be automatically generated every month.
					</TypographyMuted>
				</div>
				<div>
					<Button variant="outline" size="sm">
						<RotateCw className="size-4" />
						Refresh
					</Button>
				</div>
			</div>
			<PropertyBillingController />
			<div className="h-full w-full">
				<DataTable
					columns={columns}
					dataResponse={{
						rows: [
							{
								id: '1',
								created_at: new Date(),
								status: 'BillingInvoice.Status.Pending',
								amount: 1500,
								client_id: 'client_1',
								client: {
									id: 'client_1',
									created_at: new Date(),
									updated_at: new Date(),
								},
								currency: 'GHS',
								due_date: null,
								paid_at: null,
								updated_at: new Date(),
								property_id: 'property_1',
								property: {
									id: 'property_1',
									name: 'Sunset Apartments',
									description: '',
									address: '123 Main St, Accra',
									gps_address: 'GH-123-4567',
									city: 'Accra',
									state: 'Greater Accra',
									zip_code: '00123',
									type: 'SINGLE',
									tags: [],
									status: 'Property.Status.Active',
									created_at: new Date(),
									updated_at: new Date(),
								},
							},
							{
								id: '2',
								created_at: dayjs().subtract(2, 'month').toDate(),
								status: 'BillingInvoice.Status.Paid',
								amount: 2500,
								client_id: 'client_2',
								client: {
									id: 'client_1',
									created_at: new Date(),
									updated_at: new Date(),
								},
								currency: 'GHS',
								due_date: null,
								paid_at: null,
								updated_at: new Date(),
								property_id: 'property_1',
								property: {
									id: 'property_2',
									name: 'Greenfield Villas',
									description: 'A beautiful villa with a garden.',
									address: '456 Oak St, Kumasi',
									gps_address: 'GH-456-7890',
									city: 'Kumasi',
									state: 'Ashanti',
									zip_code: '00233',
									type: 'SINGLE',
									tags: ['villa', 'furnished'],
									status: 'Property.Status.Active',
									created_at: new Date(),
									updated_at: new Date(),
								},
							},
						],
						total: 150,
						page: 1,
						page_size: 50,
						order: 'desc',
						order_by: 'created_at',
						has_prev_page: false,
						has_next_page: true,
					}}
					empty={{
						message: 'No billing invoices found',
						description:
							"Try adjusting your search or filter to find what you're looking for.",
						button: {
							label: 'Add Invoice',
							onClick: () => {
								// Handle button click
							},
						},
					}}
				/>
			</div>
		</main>
	)
}
