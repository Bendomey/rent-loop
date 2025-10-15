import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from '@tanstack/react-table'
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	CloudAlert,
	RotateCcw,
} from 'lucide-react'
import * as React from 'react'

import { useLocation, useNavigate } from 'react-router'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '../ui/empty'
import { Spinner } from '../ui/spinner'
import { EmptyOutline, type EmptyOutlineProps } from './empty'
import { Button } from '~/components/ui/button'

import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'

interface Props<T> {
	data: Array<T>
	columns: ColumnDef<T>[]
	empty: EmptyOutlineProps
	isLoading?: boolean
	error?: string
}

export function DataTable<T extends { id: string }>({
	data,
	columns,
	empty,
	isLoading,
	error,
}: Props<T>) {
	const navigate = useNavigate()
	const location = useLocation()
	const [rowSelection, setRowSelection] = React.useState({})
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({})
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	)
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	})

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row.id.toString(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	})

	let content = <></>

	if (isLoading) {
		content = (
			<TableRow>
				<TableCell colSpan={columns.length} className="h-48">
					<Empty className="w-full border border-dashed">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Spinner />
							</EmptyMedia>
							<EmptyTitle>Loading...</EmptyTitle>
							<EmptyDescription>
								Please wait while we load your request. Do not refresh the page.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</TableCell>
			</TableRow>
		)
	} else if (error) {
		content = (
			<TableRow>
				<TableCell colSpan={columns.length} className="h-48">
					<Empty className="w-full border border-dashed">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<CloudAlert className="text-red-600" />
							</EmptyMedia>
							<EmptyTitle>An Error Occurred</EmptyTitle>
							<EmptyDescription>{error}</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button
								onClick={() => navigate(location.pathname + location.search)}
								variant={'outline'}
								size="sm"
							>
								<RotateCcw />
								Retry
							</Button>
						</EmptyContent>
					</Empty>
				</TableCell>
			</TableRow>
		)
	} else {
		const rows = table.getRowModel().rows
		if (rows.length === 0) {
			content = <EmptyOutline {...empty} />
		} else {
			content = (
				<>
					{table.getRowModel().rows.map((row) => (
						<TableRow
							key={row.id}
							data-state={row.getIsSelected() && 'selected'}
							className="relative z-0"
						>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))}
				</>
			)
		}
	}

	return (
		<div className="h-full w-full flex-col">
			<div className="h-full overflow-hidden rounded-lg border">
				<Table className="h-full">
					<TableHeader className="bg-muted sticky top-0 z-10">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id} colSpan={header.colSpan}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody className="**:data-[slot=table-cell]:first:w-8">
						{content}
					</TableBody>
					<TableFooter className="w-full">
						<TableRow>
							<TableCell colSpan={columns.length} className="text-center">
								<div className="flex h-full items-center justify-between px-4">
									<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
										<div className="hidden items-center gap-2 lg:flex">
											<Label
												htmlFor="rows-per-page"
												className="text-sm font-medium"
											>
												Rows per page
											</Label>
											<Select
												value={`${table.getState().pagination.pageSize}`}
												onValueChange={(value) => {
													table.setPageSize(Number(value))
												}}
											>
												<SelectTrigger
													size="sm"
													className="w-20"
													id="rows-per-page"
												>
													<SelectValue
														placeholder={table.getState().pagination.pageSize}
													/>
												</SelectTrigger>
												<SelectContent side="top">
													{[10, 20, 30, 40, 50].map((pageSize) => (
														<SelectItem key={pageSize} value={`${pageSize}`}>
															{pageSize}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
									<div className="flex w-full items-center gap-8 lg:w-fit">
										<div className="flex w-fit items-center justify-center text-sm font-medium">
											Page {table.getState().pagination.pageIndex + 1} of{' '}
											{table.getPageCount()}
										</div>
										<div className="ml-auto flex items-center gap-2 lg:ml-0">
											<Button
												variant="outline"
												className="hidden h-8 w-8 p-0 lg:flex"
												onClick={() => table.setPageIndex(0)}
												disabled={!table.getCanPreviousPage()}
											>
												<span className="sr-only">Go to first page</span>
												<ChevronsLeft />
											</Button>
											<Button
												variant="outline"
												className="size-8"
												size="icon"
												onClick={() => table.previousPage()}
												disabled={!table.getCanPreviousPage()}
											>
												<span className="sr-only">Go to previous page</span>
												<ChevronLeft />
											</Button>
											<Button
												variant="outline"
												className="size-8"
												size="icon"
												onClick={() => table.nextPage()}
												disabled={!table.getCanNextPage()}
											>
												<span className="sr-only">Go to next page</span>
												<ChevronRight />
											</Button>
											<Button
												variant="outline"
												className="hidden size-8 lg:flex"
												size="icon"
												onClick={() =>
													table.setPageIndex(table.getPageCount() - 1)
												}
												disabled={!table.getCanNextPage()}
											>
												<span className="sr-only">Go to last page</span>
												<ChevronsRight />
											</Button>
										</div>
									</div>
								</div>
							</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			</div>
		</div>
	)
}
