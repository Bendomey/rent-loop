import { Cloud, ExternalLink } from 'lucide-react'
import type React from 'react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

export interface EmptyOutlineProps {
	message?: string
	description?: string
	icon?: React.ReactNode
	button?: {
		label: string
		onClick: () => void
	}
	learnMoreUrl?: string
	className?: string
}

export function EmptyOutline({
	message = 'No data available',
	description = 'There is currently no data to display.',
	icon,
	button,
	learnMoreUrl,
	className,
}: EmptyOutlineProps) {
	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16',
				className,
			)}
		>
			<span className="text-muted-foreground">
				{icon ?? <Cloud className="size-8" />}
			</span>
			<p className="text-sm font-medium">{message}</p>
			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}
			{learnMoreUrl ? (
				<a
					href={learnMoreUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="mt-1 inline-flex items-center gap-1 text-sm text-rose-600 hover:underline"
				>
					Learn how this works
					<ExternalLink className="size-3" />
				</a>
			) : null}
			{button ? (
				<Button onClick={button.onClick} variant="outline" size="sm">
					{button.label}
				</Button>
			) : null}
		</div>
	)
}
