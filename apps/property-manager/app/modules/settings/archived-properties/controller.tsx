import { RotateCw } from 'lucide-react'
import { SearchInput } from '~/components/search'
import { Button } from '~/components/ui/button'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { cn } from '~/lib/utils'

export const ArchivedPropertiesController = ({
	isLoading,
	refetch,
}: {
	isLoading: boolean
	refetch: VoidFunction
}) => {
	return (
		<div className="flex w-full flex-col gap-2">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<TypographyH4>Archived Properties</TypographyH4>
					<TypographyMuted>
						Hidden from your active portfolio but not deleted. Every block, unit
						and past record is kept — restore any property to bring it back.
					</TypographyMuted>
				</div>
				<div className="flex items-center justify-between gap-2 md:justify-end">
					<Button
						onClick={() => refetch()}
						disabled={isLoading}
						variant="outline"
						size="sm"
					>
						<RotateCw className={cn('size-4', { 'animate-spin': isLoading })} />
						Refresh
					</Button>
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2 text-sm">
					<SearchInput placeholder="Search archived properties..." />
				</div>
			</div>
		</div>
	)
}
