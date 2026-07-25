import type { ReactNode } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { cn } from '~/lib/utils'

export function DetailField({
	label,
	value,
}: {
	label: string
	value: ReactNode
}) {
	return (
		<div className="flex flex-col gap-1">
			<p className="text-muted-foreground font-mono text-[10px] font-medium tracking-wide uppercase">
				{label}
			</p>
			<div className="text-foreground text-[15px] font-semibold">
				{value ?? '—'}
			</div>
		</div>
	)
}

export function DetailPanel({
	label,
	children,
	className,
}: {
	label?: string
	children: ReactNode
	className?: string
}) {
	return (
		<Card className={cn('shadow-none', className)}>
			<CardContent className="space-y-5">
				{label && (
					<p className="text-muted-foreground font-mono text-[11px] font-medium tracking-wide uppercase">
						{label}
					</p>
				)}
				{children}
			</CardContent>
		</Card>
	)
}
