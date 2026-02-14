import { Receipt } from 'lucide-react'
import { Separator } from '~/components/ui/separator'
import { formatAmount } from '~/lib/format-amount'

interface InvoiceSummaryProps {
	rentAmount: number
	paymentFrequency: string
	periods: number
	securityDepositEnabled: boolean
	securityDepositAmount: number
	totalAmount: number
}

export function InvoiceSummary({
	rentAmount,
	paymentFrequency,
	periods,
	securityDepositEnabled,
	securityDepositAmount,
	totalAmount,
}: InvoiceSummaryProps) {
	const rentTotal = rentAmount * periods

	return (
		<div className="space-y-3 rounded-lg border p-4">
			<div className="flex items-center gap-2">
				<Receipt className="size-4 text-zinc-500" />
				<h3 className="text-sm font-medium">Invoice Summary</h3>
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-between text-sm">
					<span className="text-zinc-500">
						Rent ({paymentFrequency.toLowerCase()}) x {periods}{' '}
						{periods === 1 ? 'period' : 'periods'}
					</span>
					<span>{formatAmount(rentTotal)}</span>
				</div>

				{securityDepositEnabled && (
					<div className="flex items-center justify-between text-sm">
						<span className="text-zinc-500">Security deposit</span>
						<span>{formatAmount(securityDepositAmount)}</span>
					</div>
				)}

				<Separator />

				<div className="flex items-center justify-between text-sm font-semibold">
					<span>Total</span>
					<span>{formatAmount(totalAmount)}</span>
				</div>
			</div>
		</div>
	)
}
