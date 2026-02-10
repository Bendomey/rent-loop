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
				{ label: 'Active', value: 'PaymentAccount.Status.Active' },
				{ label: 'Inactive', value: 'PaymentAccount.Status.Inactive' },
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
		label: 'Account Type',
		value: {
			options: [
				{ label: 'Momo', value: 'MOMO' },
				{ label: 'Bank Transfer', value: 'BANK_TRANSFER' },
				{ label: 'Credit Card', value: 'CARD' },
				{ label: 'Cash', value: 'OFFLINE' },
			],
			urlParam: 'rail',
			defaultValues: [],
		},
		Icon: Home,
	},
]

export const PaymentAccountsController = () => {
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
