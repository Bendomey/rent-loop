import { RotateCw, ToggleLeft } from 'lucide-react'
import { useMemo } from 'react'
import { FilterSet } from '~/components/filter-set'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

export const PropertyExpensesController = ({
	isLoading,
	refetch,
}: {
	isLoading: boolean
	refetch: VoidFunction
}) => {
	const filters: Array<Filter> = useMemo(
		() => [
			{
				id: 1,
				type: 'selector',
				selectType: 'single',
				label: 'Type',
				value: {
					options: [
						{ label: 'Lease', value: 'LEASE' },
						{ label: 'Maintenance', value: 'MAINTENANCE' },
					],
					urlParam: 'context_type',
					defaultValues: [],
				},
				Icon: ToggleLeft,
			},
		],
		[],
	)

	return (
		<div className="flex w-full flex-col gap-2">
			<div className="w-full rounded-md border p-4">
				<div className="flex w-full flex-wrap items-center gap-2 text-sm">
					<FilterSet label="Filters" urlParam="filters" filters={filters} />
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-end gap-4">
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
	)
}
