import type { RowData } from '@tanstack/react-table'

/**
 * Per-column options the data table understands.
 *
 * `pin` is what makes a column lock while the rest of the grid scrolls
 * horizontally. A pinned column must be able to report a stable width, so
 * always give it an explicit `size` on the column def — the sticky offset of
 * every column after it is derived from that number.
 */
declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		/** Extra classes for the body cell. */
		className?: string
		/** Extra classes for the header cell. */
		headerClassName?: string
		/** Horizontal alignment for both header and body cell. */
		align?: 'left' | 'right' | 'center'
		/**
		 * Lock the column to an edge while the rest of the grid scrolls.
		 *
		 * A column with id `actions` pins right automatically; set this to
		 * `undefined` on that column to opt out. Pinning is dropped entirely below
		 * the `md` breakpoint, where the whole table scrolls as one.
		 */
		pin?: 'left' | 'right'
		/**
		 * Field name sent to the API as `sort_by` when this column is sorted.
		 * Defaults to the column id, which is rarely what the API wants — the id
		 * is a JS accessor path (`property.name`) while the API expects a column
		 * reference (`properties.name`).
		 */
		sortKey?: string
		/** Label shown in the Columns menu when `header` is not a plain string. */
		label?: string
	}
}

export interface DataResponse<T> {
	rows: T[]
	total: number
	page: number
	page_size: number
	order: 'asc' | 'desc'
	order_by: string
	has_prev_page: boolean
	has_next_page: boolean
}
