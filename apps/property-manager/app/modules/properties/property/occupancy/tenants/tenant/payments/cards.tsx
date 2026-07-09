import { StatCard } from '~/components/stat-card'
import { Skeleton } from '~/components/ui/skeleton'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface Props {
	isLoading: boolean
	totalAmount: number
	paidAmount: number
	outstandingAmount: number
	totalInvoices: number
}

export function TenantPaymentSectionCards({
	isLoading,
	totalAmount,
	paidAmount,
	outstandingAmount,
	totalInvoices,
}: Props) {
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2">
			<StatCard
				title="Total Payments"
				value={
					isLoading ? (
						<Skeleton className="h-8 w-32" />
					) : (
						formatAmount(convertPesewasToCedis(totalAmount))
					)
				}
				description="Total invoiced for this tenant"
			/>

			<StatCard
				title="Outstanding Payments"
				value={
					isLoading ? (
						<Skeleton className="h-8 w-32" />
					) : (
						formatAmount(convertPesewasToCedis(outstandingAmount))
					)
				}
				description="Issued & partially paid invoices"
			/>

			<StatCard
				title="Paid Payments"
				value={
					isLoading ? (
						<Skeleton className="h-8 w-32" />
					) : (
						formatAmount(convertPesewasToCedis(paidAmount))
					)
				}
				description="Lifetime payments from this tenant"
			/>

			<StatCard
				title="Total Invoices"
				value={
					isLoading ? (
						<Skeleton className="h-8 w-10" />
					) : (
						totalInvoices.toLocaleString()
					)
				}
				description="All invoices raised for this tenant"
			/>
		</div>
	)
}
