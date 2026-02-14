import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'

export type PaymentMode = 'ONE_TIME_PAYMENT' | 'CUSTOM'

interface PaymentModeSelectorProps {
	paymentMode: PaymentMode
	customPeriods: number
	stayDuration: number
	stayDurationFrequency: string
	onPaymentModeChange: (mode: PaymentMode) => void
	onCustomPeriodsChange: (periods: number) => void
}

export function PaymentModeSelector({
	paymentMode,
	customPeriods,
	stayDuration,
	stayDurationFrequency,
	onPaymentModeChange,
	onCustomPeriodsChange,
}: PaymentModeSelectorProps) {
	return (
		<div className="space-y-3 rounded-lg border p-4">
			<div>
				<h3 className="text-sm font-medium">Initial Payment</h3>
				<p className="text-xs text-zinc-500">
					How much should the tenant pay upfront before move-in? This can
					be a full payment for the entire stay or a custom number of
					periods (e.g. first month's rent + security deposit).
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<Label htmlFor="payment-mode" className="text-xs">
						Mode
					</Label>
					<Select
						value={paymentMode}
						onValueChange={(v) => onPaymentModeChange(v as PaymentMode)}
					>
						<SelectTrigger id="payment-mode">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="w-full">
							<SelectItem value="ONE_TIME_PAYMENT">
								Full stay payment
							</SelectItem>
							<SelectItem value="CUSTOM">Custom periods</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{paymentMode === 'CUSTOM' && (
					<div className="space-y-1.5">
						<Label htmlFor="custom-periods" className="text-xs">
							Number of periods (max {stayDuration})
						</Label>
						<Input
							id="custom-periods"
							type="number"
							min={1}
							max={stayDuration}
							value={customPeriods}
							onChange={(e) => {
								const val = parseInt(e.target.value) || 1
								onCustomPeriodsChange(
									Math.min(Math.max(val, 1), stayDuration),
								)
							}}
						/>
					</div>
				)}

				{paymentMode === 'ONE_TIME_PAYMENT' && (
					<div className="space-y-1.5">
						<Label className="text-xs">Periods</Label>
						<div className="flex h-9 items-center rounded-md border bg-zinc-50 px-3 text-sm text-zinc-500">
							{stayDuration} {stayDurationFrequency.toLowerCase()}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
