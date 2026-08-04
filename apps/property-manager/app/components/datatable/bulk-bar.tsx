import type * as React from 'react'
import { cn } from '~/lib/utils'

/**
 * The dark bar that slides in above the grid once rows are ticked. It inverts
 * against the page surface in both themes because it is painted with the
 * foreground/background pair rather than a fixed colour.
 */
export function DataTableBulkBar({
	count,
	onClear,
	children,
}: {
	count: number
	onClear: () => void
	children?: React.ReactNode
}) {
	if (count === 0) return null

	return (
		<div className="bg-foreground mb-3.5 flex flex-wrap items-center gap-4 rounded-[14px] py-3 pr-4 pl-5 shadow-[0_8px_24px_-12px_rgba(17,17,16,0.5)]">
			<span className="text-background text-sm font-bold">
				{count} selected
			</span>
			<button
				type="button"
				onClick={onClear}
				className="text-background/65 hover:text-background cursor-pointer text-sm"
			>
				Clear
			</button>
			<div className="ml-auto flex flex-wrap items-center gap-2">
				{children}
			</div>
		</div>
	)
}

/**
 * A button styled for the bulk bar's dark surface. `variant="danger"` is the
 * crimson fill reserved for destructive bulk actions.
 */
export function DataTableBulkAction({
	variant = 'default',
	className,
	...props
}: React.ComponentProps<'button'> & { variant?: 'default' | 'danger' }) {
	return (
		<button
			type="button"
			className={cn(
				"inline-flex cursor-pointer items-center gap-2 rounded-md px-[15px] py-[9px] text-sm font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				variant === 'danger'
					? 'bg-primary hover:bg-primary/90 text-white'
					: 'bg-background/15 hover:bg-background/25 text-background',
				className,
			)}
			{...props}
		/>
	)
}
