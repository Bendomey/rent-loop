import type { ColumnDef, RowData } from '@tanstack/react-table'
import { Checkbox } from '~/components/ui/checkbox'

export const SELECT_COLUMN_ID = '__select'

/**
 * The checkbox column. Prepended by `DataTable` when `enableRowSelection` is
 * set, and pinned left so it stays put while the grid scrolls sideways.
 */
export function selectColumn<T extends RowData>(): ColumnDef<T> {
	return {
		id: SELECT_COLUMN_ID,
		size: 56,
		enableSorting: false,
		enableHiding: false,
		meta: { pin: 'left', align: 'center' },
		header: ({ table }) => (
			<Checkbox
				className="size-5 rounded-[6px]"
				checked={
					table.getIsAllPageRowsSelected()
						? true
						: table.getIsSomePageRowsSelected()
							? 'indeterminate'
							: false
				}
				onCheckedChange={(value) =>
					table.toggleAllPageRowsSelected(value === true)
				}
				aria-label="Select all rows on this page"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				className="size-5 rounded-[6px]"
				checked={row.getIsSelected()}
				disabled={!row.getCanSelect()}
				onCheckedChange={(value) => row.toggleSelected(value === true)}
				onClick={(event) => event.stopPropagation()}
				aria-label="Select row"
			/>
		),
	}
}
