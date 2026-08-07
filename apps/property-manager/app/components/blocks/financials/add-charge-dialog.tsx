import { useQueryClient } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useComposeInvoice, useCreateCharge } from '~/api/financial-accounts'
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
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
	formatAmount,
} from '~/lib/format-amount'

interface AddChargeDialogProps {
	open: boolean
	accountId: string
	clientId: string
	propertyId: string
	currency: string
	defaultDueDate: Nullable<string>
	/**
	 * When the collection plan will next issue an invoice, if it will at all.
	 * Null covers both a MANUAL account and one with nothing left to bill — in
	 * either case an unbilled charge waits for someone to act.
	 */
	nextIssueOn?: Nullable<Date>
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
	nextIssueOn,
	onClose,
}: AddChargeDialogProps) {
	const queryClient = useQueryClient()
	const createCharge = useCreateCharge()
	const compose = useComposeInvoice()
	const isPending = createCharge.isPending || compose.isPending

	const [category, setCategory] = useState<ChargeCategory>('SECURITY_DEPOSIT')
	const [name, setName] = useState('Security deposit')
	const [amount, setAmount] = useState('')
	const [due, setDue] = useState(isoDay(defaultDueDate))
	const [billNow, setBillNow] = useState(false)

	if (!open) return null

	const minor = convertCedisToPesewas(
		Number.parseFloat(amount.replace(/,/g, '')) || 0,
	)

	const done = () => {
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
		})
		void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
		setBillNow(false)
		onClose()
	}

	const add = () => {
		createCharge.mutate(
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
				onSuccess: (charge) => {
					if (!billNow) {
						toast.success(`${name.trim()} added.`)
						done()
						return
					}

					// Two calls, not one: there is no create-and-bill endpoint. The
					// charge already exists by the time this runs, so a failure here
					// is partial — the money is owed, it just isn't billed yet, and
					// the message has to say so rather than read as a total failure.
					compose.mutate(
						{
							client_id: clientId,
							property_id: propertyId,
							account_id: accountId,
							data: {
								claims: [
									{ charge_instance_id: charge.id, amount: charge.amount },
								],
								due_date: charge.due_date,
								issue: true,
							},
						},
						{
							onSuccess: (invoice) => {
								toast.success(
									`${name.trim()} added and billed on ${invoice.code}.`,
								)
								done()
							},
							onError: () => {
								toast.warning(
									`${name.trim()} was added, but the invoice could not be created. Bill it from Pay charges.`,
								)
								done()
							},
						},
					)
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
						Something the tenant owes on top of rent — a deposit, a repair, a
						utility bill. It gets added to their next bill when it&apos;s due,
						or you can bill them for it right away.
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

					{/* The checkbox is the choice; the strip under it is the outcome.
					    Folded together they read as a contradiction — an imperative
					    label above a sentence describing the state it is not in. */}
					<div className="overflow-hidden rounded-xl border">
						<label
							className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 p-4"
							htmlFor="charge-bill-now"
						>
							<Checkbox
								id="charge-bill-now"
								checked={billNow}
								onCheckedChange={(next) => setBillNow(next === true)}
							/>
							<span className="text-sm font-semibold">
								Bill it straight away
							</span>
						</label>

						<p className="bg-muted text-muted-foreground border-t px-4 py-3 text-xs leading-relaxed">
							<span className="font-semibold tracking-wide uppercase">
								When you save
							</span>
							<br />
							{billNow ? (
								<>
									An invoice for{' '}
									<span className="text-foreground font-semibold">
										{formatAmount(convertPesewasToCedis(minor), currency)}
									</span>{' '}
									is created and issued to the tenant right away.
								</>
							) : nextIssueOn ? (
								<>
									The charge is added and waits — it joins the invoice going out
									on{' '}
									<span className="text-foreground font-semibold">
										{nextIssueOn.toLocaleDateString('en-GB', {
											day: 'numeric',
											month: 'short',
											year: 'numeric',
										})}
									</span>
									.
								</>
							) : (
								'The charge is added and waits. Nothing is issued automatically on this account, so it sits there until you bill it from Pay charges.'
							)}
						</p>
					</div>

					<Alert>
						<Info className="size-4" />
						<AlertDescription>
							<p>
								Charges can't be edited once created — if the amount is wrong
								you remove this one and add another.
							</p>
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
						{billNow ? 'Add and bill' : 'Add charge'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
