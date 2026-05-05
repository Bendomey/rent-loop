import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'

interface SecurityDepositProps {
	enabled: boolean
	amount: number
	onEnabledChange: (enabled: boolean) => void
	onAmountChange: (amount: number) => void
}

export function SecurityDeposit({
	enabled,
	amount,
	onEnabledChange,
	onAmountChange,
}: SecurityDepositProps) {
	return (
		<div className="space-y-3 rounded-lg border p-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-medium">Security Deposit</h3>
					<p className="text-xs text-zinc-500">
						Require a refundable security deposit from the tenant.
					</p>
				</div>
				<Switch checked={enabled} onCheckedChange={onEnabledChange} />
			</div>

			{enabled && (
				<div className="space-y-1.5">
					<Label htmlFor="deposit-amount" className="text-xs">
						Deposit Amount (GH₵)
					</Label>
					<Input
						id="deposit-amount"
						type="number"
						min={0}
						step={0.01}
						value={amount}
						onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
					/>
				</div>
			)}
		</div>
	)
}
