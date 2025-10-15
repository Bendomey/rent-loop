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

export interface EmptyOutlineProps {
	message?: string
	description?: string
	button?: {
		label: string
		onClick: () => void
	}
}

export function EmptyOutline({
	message = 'No data available',
	description = 'There is currently no data to display.',
	button,
}: EmptyOutlineProps) {
	return (
		<Empty className="border border-dashed">
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
