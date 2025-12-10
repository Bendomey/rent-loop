interface LoadingContainerProps {
	size?: 'full' | 'default'
}

export const LoadingContainer = ({
	size = 'default',
}: LoadingContainerProps) => {
	const sizeClass = size === 'full' ? 'w-screen h-screen' : 'h-[50vh]'

	return (
		<div className={`${sizeClass} flex flex-col items-center justify-center`}>
			<div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
		</div>
	)
}
