import { StatCard } from '~/components/stat-card'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface Props {
	data: Invoice
}

export function TenantPaymentSectionCards({ data }: Props) {
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
			<StatCard
				title="Sub Total"
				value={formatAmount(convertPesewasToCedis(data?.sub_total || 0))}
				description="Subtotal before taxes and fees"
			/>

			<StatCard
				title="Total Paid"
				value={formatAmount(convertPesewasToCedis(data?.total_amount || 0))}
				description="Includes partial payments and credits"
			/>
		</div>
	)
}
