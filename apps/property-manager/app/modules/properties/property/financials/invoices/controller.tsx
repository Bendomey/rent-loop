import { RotateCw, ToggleLeft } from 'lucide-react'
import { useMemo } from 'react'
import { FilterSet } from '~/components/filter-set'
import { SearchInput } from '~/components/search'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

export const PropertyFinancialsRentPaymentController = ({
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
				label: 'Status',
				value: {
					options: [
						{
							label: 'Draft',
							value: 'DRAFT',
						},
						{
							label: 'Issued',
							value: 'ISSUED',
						},
						{ label: 'Partially Paid', value: 'PARTIALLY_PAID' },
						{ label: 'Paid', value: 'PAID' },
						{ label: 'Void', value: 'VOID' },
					],
					urlParam: 'status',
					defaultValues: [],
				},
				Icon: ToggleLeft,
			},
			{
				id: 2,
				type: 'selector',
				selectType: 'single',
				label: 'Payer Type',
				value: {
					options: [
						{
							label: 'Tenant',
							value: 'TENANT',
						},
						{
							label: 'Applicant',
							value: 'TENANT_APPLICATION',
						},
						{ label: 'Owner', value: 'PROPERTY_OWNER' },
					],
					urlParam: 'payer_type',
					defaultValues: [],
				},
				Icon: ToggleLeft,
			},
			{
				id: 3,
				type: 'selector',
				selectType: 'single',
				label: 'Payee Type',
				value: {
					options: [
						{
							label: 'Owner',
							value: 'PROPERTY_OWNER',
						},
						{
							label: 'System',
							value: 'RENTLOOP',
						},
					],
					urlParam: 'payee_type',
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
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2 text-sm">
					<SearchInput placeholder="Search invoice..." />
				</div>
				<div className="flex items-center justify-end gap-2">
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
		</div>
	)
}
