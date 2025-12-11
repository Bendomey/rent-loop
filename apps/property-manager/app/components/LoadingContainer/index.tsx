import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '../ui/empty'
import { Spinner } from '../ui/spinner'

interface LoadingContainerProps {
	size?: 'full' | 'default'
}

export const LoadingContainer = ({
	size = 'default',
}: LoadingContainerProps) => {
	const sizeClass = size === 'full' ? 'w-screen h-screen' : 'h-[50vh]'

	return (
		<div className={`${sizeClass} flex flex-col items-center justify-center`}>
			<Empty className="w-full">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Spinner />
					</EmptyMedia>
					<EmptyTitle>Loading...</EmptyTitle>
					<EmptyDescription>
						Please wait while we load your request. Do not refresh the page.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}
