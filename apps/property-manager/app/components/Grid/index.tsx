import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { EmptyOutline, type EmptyOutlineProps } from '../datatable/empty'
import { ErrorContainer, type ErrorProps } from '../ErrorContainer'
import { LoadingContainer } from '../LoadingContainer'
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '../ui/pagination'
import { ScrollArea } from '../ui/scroll-area'

interface DataResponse<T> {
	rows: T[]
	total: number
	page: number
	page_size: number
	order: 'asc' | 'desc'
	order_by: string
	has_prev_page: boolean
	has_next_page: boolean
}

interface GridColumns {
	sm?: number
	md?: number
	lg?: number
	xl?: number
}

interface Props<T extends { id: string }> {
	dataResponse: DataResponse<T>
	empty?: EmptyOutlineProps
	isLoading?: boolean
	error?: ErrorProps
	refetch?: VoidFunction
	boxHeight?: number
	gridColumns?: GridColumns
	gridElement: React.ComponentType<{ data: T }>
}

export function GridElement<T extends { id: string }>({
	dataResponse,
	empty,
	isLoading = false,
	error,
	boxHeight = 65,
	gridColumns = {},
	gridElement: GridItem,
}: Props<T>) {
	const [searchParams, setSearchParams] = useSearchParams()

	const data = dataResponse?.rows ?? []

	const gridClass = useMemo(
		() => `
      grid gap-4
      ${gridColumns.sm ? `grid-cols-${gridColumns.sm}` : 'grid-cols-1'}
      ${gridColumns.md ? `md:grid-cols-${gridColumns.md}` : ''}
      ${gridColumns.lg ? `lg:grid-cols-${gridColumns.lg}` : ''}
      ${gridColumns.xl ? `xl:grid-cols-${gridColumns.xl}` : ''}
    `,
		[gridColumns],
	)

	const goToPage = (pageNumber: number) => {
		const params = new URLSearchParams(searchParams)
		params.set('page', pageNumber.toString())
		setSearchParams(params)
	}

	const totalPages = Math.ceil(dataResponse.total / dataResponse.page_size)

	const { pageNumbers, startPage, visiblePages } = useMemo(() => {
		const visiblePages = Math.min(totalPages, 4)

		let startPage = Math.max(1, dataResponse.page - 1)
		if (startPage + visiblePages - 1 > totalPages) {
			startPage = Math.max(1, totalPages - visiblePages + 1)
		}

		const pageNumbers = Array.from(
			{ length: visiblePages },
			(_, i) => startPage + i,
		)

		return { pageNumbers, startPage, visiblePages }
	}, [dataResponse.page, totalPages])

	if (isLoading) return <LoadingContainer />
	if (error) return <ErrorContainer {...error} />
	if (!data.length) return <EmptyOutline {...empty} />

	return (
		<>
			<ScrollArea
				className="bg-background mb-2 w-full rounded-xl p-4 shadow-sm"
				style={{ height: `${boxHeight}vh` }}
			>
				<div className={gridClass}>
					{data.map((item) => (
						<GridItem key={item.id} data={item} />
					))}
				</div>
			</ScrollArea>

			<Pagination>
				<PaginationContent>
					<PaginationItem
						className={
							!dataResponse.has_prev_page
								? 'pointer-events-none opacity-50'
								: ''
						}
						onClick={() =>
							dataResponse.has_prev_page && goToPage(dataResponse.page - 1)
						}
					>
						<PaginationPrevious />
					</PaginationItem>

					{startPage > 1 && (
						<PaginationItem onClick={() => goToPage(1)}>
							<PaginationLink>1</PaginationLink>
						</PaginationItem>
					)}

					{startPage > 2 && (
						<PaginationItem>
							<PaginationEllipsis />
						</PaginationItem>
					)}

					{pageNumbers.map((p) => (
						<PaginationItem key={p} onClick={() => goToPage(p)}>
							<PaginationLink isActive={p === dataResponse.page}>
								{p}
							</PaginationLink>
						</PaginationItem>
					))}

					{startPage + visiblePages - 1 < totalPages - 1 && (
						<PaginationItem>
							<PaginationEllipsis />
						</PaginationItem>
					)}

					{startPage + visiblePages - 1 < totalPages && (
						<PaginationItem onClick={() => goToPage(totalPages)}>
							<PaginationLink>{totalPages}</PaginationLink>
						</PaginationItem>
					)}

					<PaginationItem
						className={
							!dataResponse.has_next_page
								? 'pointer-events-none opacity-50'
								: ''
						}
						onClick={() =>
							dataResponse.has_next_page && goToPage(dataResponse.page + 1)
						}
					>
						<PaginationNext />
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</>
	)
}
