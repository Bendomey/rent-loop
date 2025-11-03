import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	type OnChangeFn,
	type PaginationState,
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

import { useSearchParams } from 'react-router'
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
	dataResponse: FetchMultipleDataResponse<T>
	columns: ColumnDef<T>[]
	empty: EmptyOutlineProps
	isLoading?: boolean
	error?: string
	refetch?: () => void
}

export function DataTable<T extends { id: string }>({
	dataResponse,
	columns,
	empty,
	isLoading,
	error,
	refetch,
}: Props<T>) {
	const [rowSelection, setRowSelection] = React.useState({})
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({})
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	)
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [searchParams, setSearchParams] = useSearchParams()

	const pagination = React.useMemo((): PaginationState => {
		const pageIndex = searchParams.get('page')
			? Number(searchParams.get('page')) - 1
			: dataResponse.page - 1
		const pageSize = searchParams.get('pageSize')
			? Number(searchParams.get('pageSize'))
			: dataResponse.page_size
		return {
			pageIndex,
			pageSize,
		}
	}, [dataResponse.page, dataResponse.page_size, searchParams])

	const setPagination: OnChangeFn<PaginationState> = React.useCallback(
		(input) => {
			const pageIndex =
				typeof input === 'function'
					? input(pagination).pageIndex
					: input.pageIndex
			const pageSize =
				typeof input === 'function'
					? input(pagination).pageSize
					: input.pageSize
			if (
				pageIndex !== pagination.pageIndex ||
				pageSize !== pagination.pageSize
			) {
				setSearchParams({
					...Object.fromEntries(searchParams),
					page: (pageIndex + 1).toString(),
					pageSize: pageSize.toString(),
				})
			}
		},
		[pagination, searchParams, setSearchParams],
	)

	const table = useReactTable({
		data: dataResponse.rows || [],
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		pageCount: Math.ceil(dataResponse.total / dataResponse.page_size),
		getRowId: (row) => row.id.toString(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		manualPagination: true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
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
							<Button onClick={() => refetch?.()} variant={'outline'} size="sm">
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
													className="w-24"
													id="rows-per-page"
												>
													<SelectValue
														placeholder={table.getState().pagination.pageSize}
													/>
												</SelectTrigger>
												<SelectContent side="top">
													{[
														{ value: 10, label: '😁' },
														{ value: 50, label: '😇' },
														{ value: 100, label: '😐' },
														{ value: 150, label: '😟' },
														{ value: 200, label: '😢' },
													].map((pageSize) => (
														<SelectItem
															key={pageSize.value}
															value={`${pageSize.value}`}
														>
															{pageSize.label} {pageSize.value}
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
