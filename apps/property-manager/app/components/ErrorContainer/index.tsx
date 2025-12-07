import { CloudAlert, RotateCcw } from 'lucide-react'
import { Button } from '../ui/button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '../ui/empty'

export interface ErrorProps {
	message?: string
	description?: string
	button?: {
		label: string
		onClick: () => void
	}
	height?: string
}

export const ErrorContainer = ({
	message = 'An Error Occurred',
	description = 'Something went wrong while fetching the data.',
	button,
	height = 'h-96',
}: ErrorProps) => {
	return (
		<Empty className={`w-full border border-dashed ${height}`}>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<CloudAlert className="text-red-600" />
				</EmptyMedia>
				<EmptyTitle>{message}</EmptyTitle>
				<EmptyDescription>{description}</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				{button ? (
					<Button
						onClick={() => button.onClick()}
						variant={'outline'}
						size="sm"
					>
						<RotateCcw />
						{button.label}
					</Button>
				) : null}
			</EmptyContent>
		</Empty>
	)
}
