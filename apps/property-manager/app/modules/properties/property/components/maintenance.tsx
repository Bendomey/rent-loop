import type { ColumnDef } from '@tanstack/react-table'
import { CircleCheck, CircleX, User } from 'lucide-react'
import { useMemo } from 'react'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'

export function PropertyMaintenanceRequest() {
	const columns: ColumnDef<Maintenance>[] = useMemo(() => {
		return [
			{
				id: 'drag',
				header: () => null,
				cell: () => <User />,
			},
			{
				accessorKey: 'name',
				header: 'Task Name',
				cell: ({ getValue }) => {
					return (
						<div className="min-w-0">
							<span className="truncate text-sm font-medium">
								{getValue<string>()}
							</span>
						</div>
					)
				},
				enableHiding: false,
			},
			{
				accessorKey: 'unit_number',
				header: 'Unit Number',
				cell: ({ getValue }) => (
					<div className="min-w-0">
						<span className="truncate text-sm text-zinc-600">
							{getValue<string>()}
						</span>
					</div>
				),
			},

			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ getValue }) => {
					const status = getValue<string>()
					const approved = status === 'Maintenance.Status.Approved'
					return (
						<Badge
							variant={approved ? 'default' : 'outline'}
							className="px-2 py-0.5 text-xs"
						>
							{approved ? (
								<CircleCheck className="mr-2 inline-block" />
							) : (
								<CircleX className="mr-2 inline-block" />
							)}
							{approved ? 'Approved' : 'Pending'}
						</Badge>
					)
				},
			},
		]
	}, [])

	return (
		<main className="flex flex-col gap-2 sm:gap-4">
			<div>
				<TypographyH4>Maintenance Requests</TypographyH4>
				<TypographyMuted>Open and recent maintenance tasks</TypographyMuted>
			</div>
			<div className="w-full overflow-x-auto">
				<DataTable
					columns={columns}
					dataResponse={{
						rows: [
							{
								id: '1',
								name: 'House Plumbing',
								unit_number: 'AR-101',
								created_at: new Date(),
								updated_at: new Date(),
								status: 'Maintenance.Status.Approved',
							},
							{
								id: '2',
								name: 'Electrical Fix',
								unit_number: 'BR-202',
								created_at: new Date(),
								updated_at: new Date(),
								status: 'Maintenance.Status.Pending',
							},
							{
								id: '3',
								name: 'Roof Repair',
								unit_number: 'CR-303',
								created_at: new Date(),
								updated_at: new Date(),
								status: 'Maintenance.Status.Approved',
							},
							{
								id: '4',
								name: 'Roof Repair',
								unit_number: 'CR-303',
								created_at: new Date(),
								updated_at: new Date(),
								status: 'Maintenance.Status.Approved',
							},
						] as Maintenance[],
						total: 150,
						page: 1,
						page_size: 50,
						order: 'desc',
						order_by: 'created_at',
						has_prev_page: false,
						has_next_page: true,
					}}
					empty={{
						message: 'No maintenance requests',
						description: "You're all caught up.",
						button: {
							label: 'Create Request',
							onClick: () => {},
						},
					}}
				/>
			</div>
		</main>
	)
}
