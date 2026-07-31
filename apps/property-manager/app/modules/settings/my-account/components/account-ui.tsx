import type { LucideIcon } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { toast } from 'sonner'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'

/**
 * Shared building blocks for the My Account settings screens: a bordered
 * panel with a small mono caption, the label/value/action row used by the
 * Profile and Security tabs, and the tone pills.
 */

/**
 * Several actions on this page are built but not released yet (two-factor
 * auth, email updates, account deletion). Their controls stay visible and
 * clickable, but say so instead of doing anything.
 */
export function comingSoon(feature: string) {
	return () => toast.info(`${feature} is coming soon.`)
}

interface PanelProps {
	caption?: string
	className?: string
}

export function AccountPanel({
	caption,
	className,
	children,
}: PropsWithChildren<PanelProps>) {
	return (
		<div className={cn('bg-card rounded-xl border p-6', className)}>
			{caption ? <AccountCaption>{caption}</AccountCaption> : null}
			{children}
		</div>
	)
}

export function AccountCaption({ children }: PropsWithChildren) {
	return (
		<div className="text-muted-foreground mb-5 font-mono text-[11px] font-medium tracking-wider uppercase">
			{children}
		</div>
	)
}

interface RowProps {
	label: string
	sub?: ReactNode
	value?: ReactNode
	tone?: ReactNode
	action?: ReactNode
	last?: boolean
}

export function AccountRow({
	label,
	sub,
	value,
	tone,
	action,
	last,
}: RowProps) {
	return (
		<div
			className={cn(
				'flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-5',
				last ? '' : 'border-b',
			)}
		>
			<div className="sm:w-48 sm:shrink-0">
				<div className="text-sm font-semibold">{label}</div>
				{sub ? (
					<div className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
						{sub}
					</div>
				) : null}
			</div>

			<div className="flex min-w-0 flex-1 items-center gap-2.5">
				<span className="truncate text-[15px]">{value}</span>
				{tone}
			</div>

			<div className="shrink-0">{action}</div>
		</div>
	)
}

/**
 * A rounded icon tile — used to head the 2FA, sessions and device rows.
 */
export function AccountIconTile({
	icon: Icon,
	tone = 'muted',
	className,
}: {
	icon: LucideIcon
	tone?: 'muted' | 'success'
	className?: string
}) {
	return (
		<div
			className={cn(
				'flex size-11 shrink-0 items-center justify-center rounded-xl',
				tone === 'success'
					? 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400'
					: 'bg-muted text-muted-foreground',
				className,
			)}
		>
			<Icon className="size-5" />
		</div>
	)
}

export function SuccessBadge({ children }: PropsWithChildren) {
	return (
		<Badge className="border-transparent bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400">
			{children}
		</Badge>
	)
}

export function MutedBadge({ children }: PropsWithChildren) {
	return (
		<Badge className="bg-muted text-muted-foreground border-transparent">
			{children}
		</Badge>
	)
}

/**
 * Headline + supporting copy used at the top of each panel that isn't a
 * label/value list (2FA, danger zone, sessions summary).
 */
export function AccountBlurb({
	title,
	description,
	tone,
}: {
	title: string
	description: string
	tone?: ReactNode
}) {
	return (
		<div className="flex-1">
			<div className="flex items-center gap-2.5">
				<span className="font-semibold">{title}</span>
				{tone}
			</div>
			<p className="text-muted-foreground mt-1 max-w-xl text-sm leading-relaxed">
				{description}
			</p>
		</div>
	)
}
