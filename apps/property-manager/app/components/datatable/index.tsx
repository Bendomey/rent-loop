import {
	type Column,
	type ColumnDef,
	type ColumnFiltersState,
	type ColumnPinningState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	type OnChangeFn,
	type PaginationState,
	type Row,
	type SortingState,
	type Table as TableInstance,
	useReactTable,
	type VisibilityState,
} from '@tanstack/react-table'
import { CloudAlert, RotateCcw } from 'lucide-react'
import * as React from 'react'
import { useSearchParams } from 'react-router'

import { DataTableBulkBar } from './bulk-bar'
import { EmptyOutline, type EmptyOutlineProps } from './empty'
import { DataTablePagination } from './pagination'
import { selectColumn } from './select-column'
import { SortCaret } from './sort-caret'
import type { DataResponse } from './types'
import { Button } from '~/components/ui/button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '~/components/ui/empty'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'
import { useIsMobile } from '~/hooks/use-mobile'
import { cn } from '~/lib/utils'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const SKELETON_ROWS = 6

/** Convention: the row-actions column every table names the same way. */
export const ACTIONS_COLUMN_ID = 'actions'
/** Floor only — the column still grows to fit whatever buttons it holds. */
const DEFAULT_ACTIONS_SIZE = 96

const ALIGNMENT = {
	left: 'text-left justify-start',
	center: 'text-center justify-center',
	right: 'text-right justify-end',
} as const

/**
 * The id TanStack will give a column def, resolved before the table is built.
 * Mirrors `createColumn` — note that an accessor path has its dots swapped for
 * underscores, so `property.name` becomes `property_name`.
 */
function columnId<T>(column: ColumnDef<T>): string | undefined {
	if (column.id) return column.id
	if ('accessorKey' in column && column.accessorKey != null) {
		return String(column.accessorKey).replaceAll('.', '_')
	}
	return typeof column.header === 'string' ? column.header : undefined
}

/**
 * Column width, applied only where the column def actually asks for one.
 *
 * A column that declares no `size` is left to the browser's table layout, so
 * content and utility classes (a `w-full` on the one column that should soak up
 * the slack, say) still decide its width. Pinning `size` on every column would
 * make each one TanStack's 150px default and flatten the grid into equal
 * columns. The table still carries a minimum width overall, so it can overflow
 * and give pinned columns something to scroll against.
 *
 * A pinned column is locked to an exact width only when another pinned column
 * sits outside it, since that one's sticky offset is summed from this width.
 * The outermost pinned column on each side is free to grow with its content —
 * which matters for action columns, whose buttons vary from one icon to
 * several.
 */
function sizeStyle<T>(column: Column<T, unknown>): React.CSSProperties {
	const pinned = column.getIsPinned()
	const feedsAnOffset =
		(pinned === 'left' && !column.getIsLastColumn('left')) ||
		(pinned === 'right' && !column.getIsFirstColumn('right'))
	if (feedsAnOffset) {
		const size = column.getSize()
		return { width: size, minWidth: size, maxWidth: size }
	}
	const declared = column.columnDef.size
	return declared === undefined ? {} : { width: declared, minWidth: declared }
}

/**
 * Sticky offset for a locked column. The offset is summed from the widths of
 * the columns pinned before it, which is why pinned columns need an explicit
 * `size` on their column def.
 */
function pinStyle<T>(
	column: Column<T, unknown>,
): React.CSSProperties | undefined {
	const pinned = column.getIsPinned()
	if (!pinned) return undefined
	return pinned === 'left'
		? { left: column.getStart('left') }
		: { right: column.getAfter('right') }
}

/**
 * Makes a locked column stick, and draws the shadow marking where the locked
 * region ends.
 *
 * `surface` must supply both an opaque background and a z-index. The row's own
 * background is not enough: a sticky cell is painted in its own layer, so
 * without a background of its own the columns scrolling past show straight
 * through it, and without a z-index it is painted over by later siblings.
 */
function pinEdgeClasses<T>(column: Column<T, unknown>, surface: string) {
	const pinned = column.getIsPinned()
	if (!pinned) return undefined
	return cn(
		'sticky',
		surface,
		pinned === 'left' &&
			column.getIsLastColumn('left') &&
			'after:pointer-events-none after:absolute after:inset-y-0 after:-right-px after:w-4 after:translate-x-full after:bg-gradient-to-r after:from-black/8 after:to-transparent dark:after:from-black/40',
		pinned === 'right' &&
			column.getIsFirstColumn('right') &&
			'before:pointer-events-none before:absolute before:inset-y-0 before:-left-px before:w-4 before:-translate-x-full before:bg-gradient-to-l before:from-black/8 before:to-transparent dark:before:from-black/40',
	)
}

interface Props<T> {
	dataResponse: DataResponse<T>
	columns: ColumnDef<T>[]
	empty: EmptyOutlineProps
	isLoading?: boolean
	error?: string
	refetch?: () => void

	/** Adds the locked checkbox column and enables the bulk bar. */
	enableRowSelection?: boolean
	/** Rendered inside the bulk bar; use `DataTableBulkAction` for the buttons. */
	bulkActions?: (context: {
		rows: Row<T>[]
		clearSelection: () => void
	}) => React.ReactNode
	/** Slot above the grid — search, filter chips, `DataTableViewOptions`. */
	toolbar?: (table: TableInstance<T>) => React.ReactNode
	/** Columns hidden on first render; the viewer can restore them. */
	initialColumnVisibility?: VisibilityState
	onRowClick?: (row: T) => void
	pageSizeOptions?: number[]
	/** Caps the grid's height so the header sticks while the body scrolls. */
	maxHeight?: string
	className?: string
}

export function DataTable<T extends { id: string }>({
	dataResponse,
	columns,
	empty,
	isLoading,
	error,
	refetch,
	enableRowSelection = false,
	bulkActions,
	toolbar,
	initialColumnVisibility,
	onRowClick,
	pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
	maxHeight,
	className,
}: Props<T>) {
	const [rowSelection, setRowSelection] = React.useState({})
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>(initialColumnVisibility ?? {})
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	)
	const [searchParams, setSearchParams] = useSearchParams()
	const isMobile = useIsMobile()

	const resolvedColumns = React.useMemo(() => {
		const withSelection = enableRowSelection
			? [selectColumn<T>(), ...columns]
			: columns
		// Row actions have to stay reachable however far the grid is scrolled, so
		// the shared `actions` column locks to the right across every table rather
		// than each one opting in. A column can still override either default by
		// setting `meta.pin` or its own `size`.
		return withSelection.map((column) =>
			columnId(column) === ACTIONS_COLUMN_ID
				? {
						...column,
						size: column.size ?? DEFAULT_ACTIONS_SIZE,
						meta: { pin: 'right' as const, ...column.meta },
					}
				: column,
		)
	}, [columns, enableRowSelection])

	// Locking is column config rather than viewer state, so it is derived from
	// `meta.pin` on every render instead of being held in state.
	//
	// On a phone a locked column would eat most of the viewport and leave very
	// little to scroll, so nothing pins there — the whole table scrolls as one.
	// Dropping the pinning state (rather than hiding it in CSS) keeps a single
	// source of truth: `getIsPinned()` goes false and the sticky offsets, edge
	// shadows and fixed widths all fall away with it.
	const columnPinning = React.useMemo((): ColumnPinningState => {
		if (isMobile) return { left: [], right: [] }
		const left: string[] = []
		const right: string[] = []
		for (const column of resolvedColumns) {
			const pin = column.meta?.pin
			if (!pin) continue
			const id = columnId(column)
			if (!id) continue
			if (pin === 'left') left.push(id)
			else right.push(id)
		}
		return { left, right }
	}, [isMobile, resolvedColumns])

	// The URL carries the API's field name; the table works in column ids.
	const [sortKeyById, idBySortKey] = React.useMemo(() => {
		const byId = new Map<string, string>()
		const byKey = new Map<string, string>()
		for (const column of resolvedColumns) {
			const id = columnId(column)
			if (!id) continue
			const key = column.meta?.sortKey ?? id
			byId.set(id, key)
			byKey.set(key, id)
		}
		return [byId, byKey] as const
	}, [resolvedColumns])

	const pagination = React.useMemo((): PaginationState => {
		const pageIndex = searchParams.get('page')
			? Number(searchParams.get('page')) - 1
			: dataResponse.page - 1
		const pageSize = searchParams.get('pageSize')
			? Number(searchParams.get('pageSize'))
			: dataResponse.page_size
		return { pageIndex, pageSize }
	}, [dataResponse.page, dataResponse.page_size, searchParams])

	// Sorting is server-side: the header writes `sort_by`/`sort` to the URL and
	// the page's query re-runs against the API.
	//
	// Only an explicit sort in the URL counts. Falling back to the response's
	// `order_by` would make the third state invisible — clearing the sort would
	// immediately re-derive a caret from whatever the API defaulted to, so the
	// default-sorted column could never be returned to neutral.
	const sorting = React.useMemo((): SortingState => {
		const field = searchParams.get('sort_by')
		if (!field) return []
		const id = idBySortKey.get(field) ?? field
		return [{ id, desc: searchParams.get('sort') !== 'asc' }]
	}, [idBySortKey, searchParams])

	const setPagination: OnChangeFn<PaginationState> = React.useCallback(
		(input) => {
			const next = typeof input === 'function' ? input(pagination) : input
			if (
				next.pageIndex === pagination.pageIndex &&
				next.pageSize === pagination.pageSize
			) {
				return
			}
			// Changing the page size re-slices the result set, so start over.
			const pageIndex =
				next.pageSize === pagination.pageSize ? next.pageIndex : 0
			setSearchParams({
				...Object.fromEntries(searchParams),
				page: (pageIndex + 1).toString(),
				pageSize: next.pageSize.toString(),
			})
		},
		[pagination, searchParams, setSearchParams],
	)

	const setSorting: OnChangeFn<SortingState> = React.useCallback(
		(input) => {
			const next = typeof input === 'function' ? input(sorting) : input
			const params = { ...Object.fromEntries(searchParams) }
			const [first] = next
			if (!first) {
				delete params.sort_by
				delete params.sort
			} else {
				params.sort_by = sortKeyById.get(first.id) ?? first.id
				params.sort = first.desc ? 'desc' : 'asc'
			}
			// A re-sort reorders everything, so page 1 is the only sane landing.
			params.page = '1'
			setSearchParams(params)
		},
		[searchParams, setSearchParams, sortKeyById, sorting],
	)

	const table = useReactTable({
		data: dataResponse.rows || [],
		columns: resolvedColumns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
			columnPinning,
		},
		pageCount: Math.max(
			1,
			Math.ceil(dataResponse.total / (dataResponse.page_size || 1)),
		),
		getRowId: (row) => row.id.toString(),
		// Sorting is server-side and every sortable field has to be whitelisted
		// against the API, so columns opt in with `enableSorting: true` rather
		// than every column advertising a caret that does nothing.
		defaultColumn: { enableSorting: false },
		enableRowSelection,
		// Headers cycle through three states: ascending, descending, then back to
		// unsorted, which drops `sort_by`/`sort` from the URL and lets the API
		// fall back to its own default ordering.
		enableSortingRemoval: true,
		manualPagination: true,
		manualSorting: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	})

	const leafColumns = table.getVisibleLeafColumns()
	const colSpan = leafColumns.length || 1
	const rows = table.getRowModel().rows
	const selectedRows = table.getSelectedRowModel().rows

	// Rows are keyed by id; a refetch that drops a selected row would otherwise
	// leave it counted in the bulk bar forever.
	React.useEffect(() => {
		const present = new Set(dataResponse.rows?.map((row) => row.id) ?? [])
		setRowSelection((current) => {
			const next = Object.fromEntries(
				Object.entries(current).filter(([id]) => present.has(id)),
			)
			return Object.keys(next).length === Object.keys(current).length
				? current
				: next
		})
	}, [dataResponse.rows])

	let body: React.ReactNode

	if (isLoading) {
		body = Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
			<TableRow
				key={`skeleton-${rowIndex}`}
				className="group/row bg-card border-border/60 hover:bg-card h-[76px]"
			>
				{leafColumns.map((column, columnIndex) => (
					<TableCell
						key={column.id}
						style={{ ...sizeStyle(column), ...pinStyle(column) }}
						className={cn(
							'border-border/60 h-[76px] border-r border-b px-[22px] align-middle last:border-r-0',
							pinEdgeClasses(column, 'bg-card z-10'),
						)}
					>
						<div
							className="bg-foreground/[0.07] h-3 rounded-full"
							style={{
								width: `${45 + ((rowIndex * 13 + columnIndex * 17) % 40)}%`,
							}}
						/>
					</TableCell>
				))}
			</TableRow>
		))
	} else if (error) {
		body = (
			<TableRow className="hover:bg-transparent">
				<TableCell colSpan={colSpan} className="h-48 whitespace-normal">
					<Empty className="border-border w-full border border-dashed">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<CloudAlert className="text-destructive" />
							</EmptyMedia>
							<EmptyTitle>An Error Occurred</EmptyTitle>
							<EmptyDescription>{error}</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button onClick={() => refetch?.()} variant="outline" size="sm">
								<RotateCcw />
								Retry
							</Button>
						</EmptyContent>
					</Empty>
				</TableCell>
			</TableRow>
		)
	} else if (rows.length === 0) {
		body = (
			<TableRow className="hover:bg-transparent">
				<TableCell colSpan={colSpan} className="h-48 whitespace-normal">
					<EmptyOutline {...empty} />
				</TableCell>
			</TableRow>
		)
	} else {
		body = rows.map((row) => (
			<TableRow
				key={row.id}
				data-state={row.getIsSelected() ? 'selected' : undefined}
				onClick={onRowClick ? () => onRowClick(row.original) : undefined}
				className={cn(
					'group/row bg-card border-border/60 h-[76px] hover:bg-[var(--row-hover)] data-[state=selected]:bg-[var(--row-selected)]',
					onRowClick && 'cursor-pointer',
				)}
			>
				{row.getVisibleCells().map((cell) => {
					const meta = cell.column.columnDef.meta
					return (
						<TableCell
							key={cell.id}
							style={{ ...sizeStyle(cell.column), ...pinStyle(cell.column) }}
							className={cn(
								'border-border/60 h-[76px] border-r border-b px-[22px] align-middle whitespace-normal last:border-r-0',
								ALIGNMENT[meta?.align ?? 'left'],
								pinEdgeClasses(
									cell.column,
									'bg-card z-10 group-hover/row:bg-[var(--row-hover)] group-data-[state=selected]/row:bg-[var(--row-selected)]',
								),
								meta?.className,
							)}
						>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</TableCell>
					)
				})}
			</TableRow>
		))
	}

	return (
		<div className={cn('flex w-full min-w-0 flex-col', className)}>
			{toolbar ? <div className="mb-4">{toolbar(table)}</div> : null}

			{enableRowSelection ? (
				<DataTableBulkBar
					count={selectedRows.length}
					onClear={() => table.resetRowSelection()}
				>
					{bulkActions?.({
						rows: selectedRows,
						clearSelection: () => table.resetRowSelection(),
					})}
				</DataTableBulkBar>
			) : null}

			<div className="border-border bg-card w-full min-w-0 overflow-hidden rounded-xl border">
				{/* border-separate keeps cell rules painted on sticky/pinned cells,
				    which collapsed borders drop. */}
				<Table
					containerStyle={{ maxHeight }}
					style={{ minWidth: table.getTotalSize() }}
					className="w-full border-separate border-spacing-0"
				>
					<TableHeader className="[&_tr]:border-b-0">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								key={headerGroup.id}
								className="bg-muted hover:bg-muted"
							>
								{headerGroup.headers.map((header) => {
									const meta = header.column.columnDef.meta
									const canSort = header.column.getCanSort()
									const sorted = header.column.getIsSorted()
									return (
										<TableHead
											key={header.id}
											colSpan={header.colSpan}
											aria-sort={
												!canSort
													? undefined
													: sorted === 'asc'
														? 'ascending'
														: sorted === 'desc'
															? 'descending'
															: 'none'
											}
											style={{
												...sizeStyle(header.column),
												...pinStyle(header.column),
											}}
											className={cn(
												'text-foreground border-border/60 sticky top-0 z-20 border-r border-b',
												'h-14 px-[22px] text-[13px] font-bold tracking-[0.2px] whitespace-nowrap last:border-r-0',
												sorted && 'bg-foreground/[0.035]',
												pinEdgeClasses(header.column, 'bg-muted z-30'),
												meta?.headerClassName,
											)}
										>
											{header.isPlaceholder ? null : canSort ? (
												<button
													type="button"
													onClick={header.column.getToggleSortingHandler()}
													className={cn(
														'flex w-full cursor-pointer items-center gap-2 select-none',
														ALIGNMENT[meta?.align ?? 'left'],
													)}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													<SortCaret direction={sorted} />
												</button>
											) : (
												<div
													className={cn(
														'flex w-full items-center gap-2',
														ALIGNMENT[meta?.align ?? 'left'],
													)}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
												</div>
											)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody className="[&>tr:last-child>td]:border-b-0">
						{body}
					</TableBody>
				</Table>
			</div>

			{!isLoading && !error && rows.length > 0 ? (
				<DataTablePagination
					table={table}
					total={dataResponse.total}
					pageSizeOptions={pageSizeOptions}
				/>
			) : null}
		</div>
	)
}

export { DataTableBulkAction, DataTableBulkBar } from './bulk-bar'
export { EmptyOutline, type EmptyOutlineProps } from './empty'
export { SELECT_COLUMN_ID, selectColumn } from './select-column'
export type { DataResponse } from './types'
export { useDataTableSort, type TableSorter } from './use-table-sort'
export { DataTableViewOptions } from './view-options'
