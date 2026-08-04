import type { Table } from '@tanstack/react-table'
import { cn } from '~/lib/utils'

/**
 * Builds the page list, collapsing runs into a single ellipsis: the first and
 * last page are always shown, plus one page either side of the current one.
 */
function pageItems(current: number, pageCount: number): (number | '…')[] {
	const items: (number | '…')[] = []
	for (let page = 1; page <= pageCount; page++) {
		if (page === 1 || page === pageCount || Math.abs(page - current) <= 1) {
			items.push(page)
		} else if (items[items.length - 1] !== '…') {
			items.push('…')
		}
	}
	return items
}

function NavButton({
	className,
	...props
}: React.ComponentProps<'button'> & { disabled?: boolean }) {
	return (
		<button
			type="button"
			className={cn(
				'border-border bg-background text-foreground h-[38px] min-w-[38px] cursor-pointer rounded-md border px-3 text-sm font-semibold transition-colors',
				'hover:bg-muted disabled:text-foreground/30 disabled:pointer-events-none',
				className,
			)}
			{...props}
		/>
	)
}

export function DataTablePagination<T>({
	table,
	total,
	pageSizeOptions,
}: {
	table: Table<T>
	total: number
	pageSizeOptions: number[]
}) {
	const { pageIndex, pageSize } = table.getState().pagination
	const pageCount = Math.max(1, table.getPageCount())
	const current = Math.min(pageIndex + 1, pageCount)
	const from = total === 0 ? 0 : pageIndex * pageSize + 1
	const to = Math.min((pageIndex + 1) * pageSize, total)

	return (
		<div className="mt-4 flex flex-wrap items-center gap-4">
			<span className="text-muted-foreground text-sm">
				Showing{' '}
				<b className="text-foreground">
					{from}–{to}
				</b>{' '}
				of <b className="text-foreground">{total}</b>
			</span>

			<div className="flex items-center gap-2">
				<span className="text-muted-foreground text-sm">Rows</span>
				<div className="bg-muted flex gap-1 rounded-sm p-[3px]">
					{pageSizeOptions.map((size) => {
						const active = size === pageSize
						return (
							<button
								key={size}
								type="button"
								onClick={() => table.setPageSize(size)}
								aria-pressed={active}
								className={cn(
									'text-foreground cursor-pointer rounded-[7px] px-[11px] py-1.5 text-[13.5px] transition-colors',
									active
										? 'bg-background font-bold shadow-[0_1px_2px_rgba(0,0,0,0.10)]'
										: 'hover:bg-background/50 font-medium',
								)}
							>
								{size}
							</button>
						)
					})}
				</div>
			</div>

			<div className="ml-auto flex items-center gap-1.5">
				<NavButton
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					Previous
				</NavButton>
				{pageItems(current, pageCount).map((item, index) =>
					item === '…' ? (
						<span
							key={`gap-${index}`}
							className="text-foreground/30 px-1 text-sm"
						>
							…
						</span>
					) : (
						<button
							key={item}
							type="button"
							onClick={() => table.setPageIndex(item - 1)}
							aria-current={item === current ? 'page' : undefined}
							className={cn(
								'h-[38px] w-[38px] cursor-pointer rounded-md border text-sm transition-colors',
								item === current
									? 'border-foreground bg-foreground text-background font-bold'
									: 'border-border bg-background text-foreground hover:bg-muted font-medium',
							)}
						>
							{item}
						</button>
					),
				)}
				<NavButton
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					Next
				</NavButton>
			</div>
		</div>
	)
}
