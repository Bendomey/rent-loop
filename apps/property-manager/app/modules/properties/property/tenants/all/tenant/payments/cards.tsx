import { StatCard } from '~/components/stat-card'

export function TenantPaymentSectionCards() {
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
			<StatCard
				title="Next Rent Due"
				value="GHS 1,200"
				description="Due on 1 Feb 2025"
			/>

			<StatCard
				title="Outstanding Rent"
				value="GHS 3,500"
				description="Overdue balance"
			/>

			<StatCard
				title="Total Paid"
				value="GHS 14,400"
				description="Lifetime payments from this tenant"
			/>
		</div>
	)
}
