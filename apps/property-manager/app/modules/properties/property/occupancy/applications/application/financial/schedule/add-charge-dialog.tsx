import { useQueryClient } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateCharge } from '~/api/financial-accounts'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import { convertCedisToPesewas } from '~/lib/format-amount'

interface AddChargeDialogProps {
	open: boolean
	accountId: string
	clientId: string
	propertyId: string
	currency: string
	defaultDueDate: Nullable<string>
	onClose: () => void
}

/** RENT is excluded: rent comes from the term, never added by hand. */
const CATEGORIES: Array<{ value: ChargeCategory; label: string }> = [
	{ value: 'SECURITY_DEPOSIT', label: 'Security deposit' },
	{ value: 'AGENCY_FEE', label: 'Agency fee' },
	{ value: 'VAT', label: 'VAT' },
	{ value: 'UTILITY', label: 'Utility' },
	{ value: 'DAMAGE_CHARGE', label: 'Damage charge' },
	{ value: 'EARLY_TERMINATION_FEE', label: 'Early termination fee' },
	{ value: 'OTHER', label: 'Other' },
]

const isoDay = (value: Nullable<string>) => {
	if (!value) return new Date().toISOString().slice(0, 10)
	return new Date(value).toISOString().slice(0, 10)
}

export function AddChargeDialog({
	open,
	accountId,
	clientId,
	propertyId,
	currency,
	defaultDueDate,
	onClose,
}: AddChargeDialogProps) {
	const queryClient = useQueryClient()
	const { isPending, mutate } = useCreateCharge()

	const [category, setCategory] = useState<ChargeCategory>('SECURITY_DEPOSIT')
	const [name, setName] = useState('Security deposit')
	const [amount, setAmount] = useState('')
	const [due, setDue] = useState(isoDay(defaultDueDate))

	if (!open) return null

	const minor = convertCedisToPesewas(
		Number.parseFloat(amount.replace(/,/g, '')) || 0,
	)

	const add = () => {
		mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				account_id: accountId,
				data: {
					name: name.trim(),
					category,
					amount: minor,
					currency,
					due_date: new Date(`${due}T00:00:00Z`).toISOString(),
				},
			},
			{
				onSuccess: () => {
					toast.success(`${name.trim()} added to the ledger.`)
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
					})
					onClose()
				},
				onError: () =>
					toast.error('Could not add the charge. Please try again.'),
			},
		)
	}

	return (
		<Dialog open onOpenChange={(next) => !next && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add a charge</DialogTitle>
					<DialogDescription>
						One-off amounts sit in the ledger beside the rent. They are swept
						into the next invoice once they fall due, or you can collect them
						now.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<Label>Type</Label>
						<div className="mt-2 flex flex-wrap gap-2">
							{CATEGORIES.map((option) => (
								<Button
									key={option.value}
									variant={category === option.value ? 'default' : 'outline'}
									size="sm"
									onClick={() => {
										setCategory(option.value)
										setName(option.label)
									}}
								>
									{option.label}
								</Button>
							))}
						</div>
					</div>

					<div>
						<Label htmlFor="charge-name">What the tenant will see</Label>
						<Input
							id="charge-name"
							className="mt-2"
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
					</div>

					<div className="flex gap-4">
						<div className="flex-1">
							<Label htmlFor="charge-amount">Amount</Label>
							<div className="mt-2 flex items-center gap-2">
								<span className="text-muted-foreground text-sm font-semibold">
									GH₵
								</span>
								<Input
									id="charge-amount"
									inputMode="decimal"
									placeholder="0.00"
									value={amount}
									onChange={(event) => setAmount(event.target.value)}
								/>
							</div>
						</div>
						<div className="flex-1">
							<Label htmlFor="charge-due">Due date</Label>
							<Input
								id="charge-due"
								type="date"
								className="mt-2"
								value={due}
								onChange={(event) => setDue(event.target.value)}
							/>
						</div>
					</div>

					<Alert>
						<Info className="size-4" />
						<AlertDescription>
							Charges can't be edited once created — if the amount is wrong you
							remove this one and add another.
						</AlertDescription>
					</Alert>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={isPending}>
						Cancel
					</Button>
					<Button
						onClick={add}
						disabled={isPending || minor <= 0 || !name.trim()}
					>
						{isPending ? <Spinner /> : null}
						Add charge
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
