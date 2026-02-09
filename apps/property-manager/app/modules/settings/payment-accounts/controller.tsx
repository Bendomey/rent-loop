import { Home, ToggleLeft } from 'lucide-react'
import { FilterSet } from '~/components/filter-set'

const filters: Array<Filter> = [
	{
		id: 1,
		type: 'selector',
		selectType: 'single',
		label: 'Status',
		value: {
			options: [
				{ label: 'Pending', value: 'Billing.Status.Pending' },
				{ label: 'Paid', value: 'Billing.Status.Paid' },
			],
			urlParam: 'status',
			defaultValues: [],
		},
		Icon: ToggleLeft,
	},
	{
		id: 2,
		type: 'selector',
		selectType: 'multi',
		label: 'Property',
		value: {
			options: [
				{ label: 'Sunset Apartments', value: 'property_1' },
				{ label: 'Greenfield Villas', value: 'property_2' },
			],
			urlParam: 'property',
			defaultValues: [],
		},
		Icon: Home,
	},
]

export const BillingsController = () => {
	return (
		<div className="flex w-full flex-col gap-2">
			<div className="w-full rounded-md border p-4">
				<div className="flex w-full flex-wrap items-center gap-2 text-sm">
					<FilterSet label="Filters" urlParam="filters" filters={filters} />
				</div>
			</div>
		</div>
	)
}
