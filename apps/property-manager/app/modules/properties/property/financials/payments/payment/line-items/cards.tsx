import { StatCard } from '~/components/stat-card'
import { formatAmount } from '~/lib/format-amount'

interface Props {
	data: Invoice
}

export function TenantPaymentSectionCards({ data }: Props) {
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
			<StatCard
				title="Tax & Fees"
				value={formatAmount(data?.taxes || 0)}
				description="Due on 1 Feb 2025"
			/>

			<StatCard
				title="Sub Total"
				value={formatAmount(data?.sub_total || 0)}
				description="Overdue balance"
			/>

			<StatCard
				title="Total Paid"
				value={formatAmount(data?.total_amount || 0)}
				description="Includes partial payments and credits"
			/>
		</div>
	)
}
