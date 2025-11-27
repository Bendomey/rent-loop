import { Plus, RotateCw } from 'lucide-react'
import { Link } from 'react-router'
// import { FilterSet } from '~/components/filter-set'
// import { SearchInput } from '~/components/search'
import { Button } from '~/components/ui/button'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { cn } from '~/lib/utils'

// TODO: bring this back after API supports it.
// const filters: Array<Filter> = [
// 	{
// 		id: 1,
// 		type: 'selector',
// 		selectType: 'single',
// 		label: 'Status',
// 		value: {
// 			options: [
// 				{ label: 'Active', value: 'Property.Status.Active' },
// 				{ label: 'Inactive', value: 'Property.Status.Inactive' },
// 				{ label: 'Maintenance', value: 'Property.Status.Maintenance' },
// 			],
// 			urlParam: 'status',
// 			defaultValues: [],
// 		},
// 		Icon: ToggleLeft,
// 	},
// 	{
// 		id: 1,
// 		type: 'selector',
// 		selectType: 'single',
// 		label: 'Type',
// 		value: {
// 			options: [
// 				{ label: 'Single', value: 'SINGLE' },
// 				{ label: 'Multi', value: 'MULTI' },
// 			],
// 			urlParam: 'type',
// 			defaultValues: [],
// 		},
// 		Icon: ToggleLeft,
// 	},
// ]

export const PropertiesController = ({
	isLoading,
	refetch,
}: {
	isLoading: boolean
	refetch: VoidFunction
}) => {
	// 	Manage Members
	// These members have access to your workspace.
	return (
		<div className="flex w-full flex-col gap-2">
			<div className="flex flex-row items-center justify-between">
				<div>
					<TypographyH4>My Properties</TypographyH4>
					<TypographyMuted>
						Manage the properties you own or oversee.
					</TypographyMuted>
				</div>
				<div className="flex items-center justify-end gap-2">
					<Link to="/properties/new">
						<Button
							variant="default"
							size="sm"
							className="bg-rose-600 text-white hover:bg-rose-700"
						>
							<Plus className="size-4" />
							Add Property
						</Button>
					</Link>
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
			{/* <div className="w-full rounded-md border p-4">
				<div className="flex w-full flex-wrap items-center gap-2 text-sm">
					<FilterSet label="Filters" urlParam="filters" filters={filters} />
				</div>
			</div> */}
			{/* <div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2 text-sm">
					<SearchInput placeholder="Search properties..." />
				</div>
				
			</div> */}
		</div>
	)
}
