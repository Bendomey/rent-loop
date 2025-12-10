import { Cloud } from 'lucide-react'
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
	className?: string
}

export function EmptyOutline({
	message = 'No data available',
	description = 'There is currently no data to display.',
	button,
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
