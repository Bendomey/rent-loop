import type { SortDirection } from '@tanstack/react-table'
import { cn } from '~/lib/utils'

/**
 * The paired caret that sits after every sortable header label. Both arrows
 * are always drawn — the inactive one stays dimmed — so the header keeps its
 * width no matter which way the column is sorted.
 */
export function SortCaret({ direction }: { direction: SortDirection | false }) {
	return (
		<svg
			width="12"
			height="16"
			viewBox="0 0 12 16"
			fill="none"
			aria-hidden="true"
			className="shrink-0"
		>
			<path
				d="M6 3l3.2 3.6H2.8L6 3z"
				className={cn(
					direction === 'asc' ? 'fill-foreground' : 'fill-foreground/25',
				)}
			/>
			<path
				d="M6 13L2.8 9.4h6.4L6 13z"
				className={cn(
					direction === 'desc' ? 'fill-foreground' : 'fill-foreground/25',
				)}
			/>
		</svg>
	)
}
