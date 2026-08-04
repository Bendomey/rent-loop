import type { Column, Table } from '@tanstack/react-table'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

/** Best-effort human label for a column in the Columns menu. */
function columnLabel<T>(column: Column<T, unknown>): string {
	const meta = column.columnDef.meta
	if (meta?.label) return meta.label
	const header = column.columnDef.header
	if (typeof header === 'string' && header.length > 0) return header
	return column.id
}

/**
 * The "Columns" control — lets the viewer hide and restore columns. Lives in
 * the toolbar above the grid, so consumers place it themselves via the
 * `toolbar` render prop.
 */
export function DataTableViewOptions<T>({ table }: { table: Table<T> }) {
	const columns = table
		.getAllLeafColumns()
		.filter((column) => column.getCanHide())

	if (columns.length === 0) return null

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="h-11">
					<SlidersHorizontal />
					Columns
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-52">
				<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{columns.map((column) => (
					<DropdownMenuCheckboxItem
						key={column.id}
						checked={column.getIsVisible()}
						onCheckedChange={(value) => column.toggleVisibility(!!value)}
						onSelect={(event) => event.preventDefault()}
					>
						{columnLabel(column)}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
