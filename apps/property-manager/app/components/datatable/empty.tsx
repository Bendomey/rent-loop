import { Cloud, ExternalLink } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '~/components/ui/empty'
import { cn } from '~/lib/utils'

export interface EmptyOutlineProps {
	message?: string
	description?: string
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
	button,
	learnMoreUrl,
	className = 'h-96',
}: EmptyOutlineProps) {
	return (
		<Empty className={cn('border border-dashed', className)}>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Cloud />
				</EmptyMedia>
				<EmptyTitle>{message}</EmptyTitle>
				<EmptyDescription>{description}</EmptyDescription>
				{learnMoreUrl ? (
					<a
						href={learnMoreUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="mt-2 inline-flex items-center gap-1 text-sm text-rose-600 hover:underline"
					>
						Learn how this works
						<ExternalLink className="size-3" />
					</a>
				) : null}
			</EmptyHeader>
			<EmptyContent>
				{button ? (
					<Button onClick={button.onClick} variant="outline" size="sm">
						{button.label}
					</Button>
				) : null}
			</EmptyContent>
		</Empty>
	)
}
