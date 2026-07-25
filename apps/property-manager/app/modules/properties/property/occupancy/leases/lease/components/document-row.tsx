import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

type DocumentRowLinkProps =
	| { to: string; href?: never }
	| { href: string; to?: never }

type DocumentRowProps = DocumentRowLinkProps & {
	icon: ReactNode
	tone?: 'default' | 'blue'
	title: string
	subtitle?: string
	actionLabel?: string
}

export function DocumentRow({
	icon,
	tone = 'default',
	title,
	subtitle,
	actionLabel = 'View',
	to,
	href,
}: DocumentRowProps) {
	const toneClass =
		tone === 'blue'
			? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
			: 'bg-muted text-muted-foreground'

	return (
		<div className="flex items-center gap-3.5 border-b py-3.5 last:border-b-0">
			<div
				className={cn(
					'flex size-10 shrink-0 items-center justify-center rounded-lg',
					toneClass,
				)}
			>
				{icon}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold">{title}</p>
				{subtitle && (
					<p className="text-muted-foreground mt-0.5 truncate text-xs">
						{subtitle}
					</p>
				)}
			</div>
			<Button variant="outline" size="sm" asChild className="shrink-0">
				{to ? (
					<Link to={to}>{actionLabel}</Link>
				) : (
					<a href={href} target="_blank" rel="noopener noreferrer">
						{actionLabel}
					</a>
				)}
			</Button>
		</div>
	)
}
