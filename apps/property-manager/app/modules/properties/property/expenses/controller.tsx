import { RotateCw, Tag, ToggleLeft } from 'lucide-react'
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
						{ label: 'Maintenance', value: 'MAINTENANCE' },
						{ label: 'General', value: 'GENERAL' },
					],
					urlParam: 'context_type',
					defaultValues: [],
				},
				Icon: ToggleLeft,
			},
			{
				id: 2,
				type: 'selector',
				selectType: 'single',
				label: 'Category',
				value: {
					options: [
						{ label: 'Repairs', value: 'REPAIRS' },
						{ label: 'Utilities', value: 'UTILITIES' },
						{ label: 'Insurance', value: 'INSURANCE' },
						{ label: 'Landscaping', value: 'LANDSCAPING' },
						{ label: 'Security', value: 'SECURITY' },
						{ label: 'Management', value: 'MANAGEMENT' },
						{ label: 'Other', value: 'OTHER' },
					],
					urlParam: 'category',
					defaultValues: [],
				},
				Icon: Tag,
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
