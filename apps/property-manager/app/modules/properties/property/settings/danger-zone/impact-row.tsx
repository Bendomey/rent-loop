import { ArrowRight, type LucideIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface ImpactRowProps {
	icon: LucideIcon
	label: string
	count: number
	tone?: 'default' | 'destructive'
	dim?: boolean
	actionLabel?: string
	onAction?: () => void
}

export function ImpactRow({
	icon: Icon,
	label,
	count,
	tone = 'default',
	dim = false,
	actionLabel,
	onAction,
}: ImpactRowProps) {
	return (
		<div
			className={cn(
				'flex items-center gap-3 border-b px-4 py-3 last:border-b-0',
				dim && 'opacity-60',
			)}
		>
			<div
				className={cn(
					'flex size-9 shrink-0 items-center justify-center rounded-lg',
					tone === 'destructive'
						? 'bg-destructive/10 text-destructive'
						: 'bg-muted text-muted-foreground',
				)}
			>
				<Icon className="size-4" />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-baseline gap-2">
					<span className="text-foreground text-sm font-medium">{label}</span>
					<span
						className={cn(
							'font-mono text-xs font-semibold',
							tone === 'destructive'
								? 'text-destructive'
								: 'text-muted-foreground',
						)}
					>
						{count}
					</span>
				</div>
			</div>
			{actionLabel ? (
				<Button
					type="button"
					size="sm"
					variant="outline"
					className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 gap-1"
					onClick={onAction}
				>
					{actionLabel}
					<ArrowRight className="size-3.5" />
				</Button>
			) : null}
		</div>
	)
}
