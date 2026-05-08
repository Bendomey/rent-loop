import { RotateCw, ToggleLeft } from 'lucide-react'
import { FilterSet } from '~/components/filter-set'
import { SearchInput } from '~/components/search'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

const filters: Array<Filter> = [
	{
		id: 1,
		type: 'selector',
		selectType: 'single',
		label: 'Status',
		Icon: ToggleLeft,
		value: {
			options: [
				{ label: 'Pending', value: 'ClientApplication.Status.Pending' },
				{ label: 'Approved', value: 'ClientApplication.Status.Approved' },
				{ label: 'Rejected', value: 'ClientApplication.Status.Rejected' },
			],
			urlParam: 'status',
			defaultValues: [
				{ value: 'ClientApplication.Status.Pending', label: 'Pending' },
			],
		},
	},
]

export const ApprovalsController = ({
	isLoading,
	refetch,
}: {
	isLoading: boolean
	refetch: VoidFunction
}) => {
	return (
		<div className="flex w-full flex-col gap-2">
			<div className="w-full rounded-md border p-4">
				<div className="flex w-full flex-wrap items-center gap-2 text-sm">
					<FilterSet label="Filters" urlParam="filters" filters={filters} />
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2 text-sm">
					<SearchInput placeholder="Search applications…" />
				</div>
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
