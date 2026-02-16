import { RotateCcw } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { formatAmount } from '~/lib/format-amount'

const PAYMENT_FREQUENCIES = [
	{ value: 'DAILY', label: 'Daily' },
	{ value: 'WEEKLY', label: 'Weekly' },
	{ value: 'MONTHLY', label: 'Monthly' },
	{ value: 'QUARTERLY', label: 'Quarterly' },
	{ value: 'BIANNUALLY', label: 'Biannually' },
	{ value: 'ANNUALLY', label: 'Annually' },
] as const

interface RentSetupProps {
	rentAmount: number
	paymentFrequency: string
	defaultRentAmount: number
	defaultPaymentFrequency: string
	onRentAmountChange: (value: number) => void
	onPaymentFrequencyChange: (value: string) => void
	onReset: () => void
}

export function RentSetup({
	rentAmount,
	paymentFrequency,
	defaultRentAmount,
	defaultPaymentFrequency,
	onRentAmountChange,
	onPaymentFrequencyChange,
	onReset,
}: RentSetupProps) {
	const isModified =
		rentAmount !== defaultRentAmount ||
		paymentFrequency !== defaultPaymentFrequency

	return (
		<div className="space-y-3 rounded-lg border p-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-medium">Rent</h3>
					<p className="text-xs text-zinc-500">
						Unit default: {formatAmount(defaultRentAmount)} /{' '}
						{defaultPaymentFrequency.toLowerCase()}
					</p>
				</div>
				{isModified && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								onClick={onReset}
							>
								<RotateCcw className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Reset to unit defaults</TooltipContent>
					</Tooltip>
				)}
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<Label htmlFor="rent-amount" className="text-xs">
						Amount (GH₵)
					</Label>
					<Input
						id="rent-amount"
						type="number"
						min={0}
						step={0.01}
						value={rentAmount}
						onChange={(e) =>
							onRentAmountChange(parseFloat(e.target.value) || 0)
						}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="payment-frequency" className="text-xs">
						Payment Frequency
					</Label>
					<Select
						disabled
						value={paymentFrequency}
						onValueChange={onPaymentFrequencyChange}
					>
						<SelectTrigger id="payment-frequency">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PAYMENT_FREQUENCIES.map((freq) => (
								<SelectItem key={freq.value} value={freq.value}>
									{freq.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	)
}
