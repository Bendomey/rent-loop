import { useQueryClient } from '@tanstack/react-query'
import { Info, Plus } from 'lucide-react'
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

/**
 * Fee types in the landlord's words. The mapping to ChargeCategory stays
 * internal — nobody outside the ledger calls it a DAMAGE_CHARGE.
 */
const FEE_TYPES: Array<{
	category: ChargeCategory
	label: string
	eg: string
}> = [
	{
		category: 'DAMAGE_CHARGE',
		label: 'Repair or damage',
		eg: 'e.g. Broken window pane',
	},
	{
		category: 'UTILITY',
		label: 'Water or electricity',
		eg: 'e.g. Water · Oct–Nov',
	},
	{
		category: 'SECURITY_DEPOSIT',
		label: 'Security deposit',
		eg: 'Refunded when they leave',
	},
	{ category: 'AGENCY_FEE', label: 'Agency fee', eg: 'Your commission' },
	{ category: 'OTHER', label: 'Something else', eg: 'You name it' },
]

/**
 * "Add a fee" — the application step's own dialog.
 *
 * Deliberately not the shared `AddChargeDialog`: that one belongs to the lease
 * financials page, speaks the ledger's vocabulary, and is covered by its own
 * e2e cases. Re-wording it there would change a page this redesign does not
 * cover.
 */
export function AddFeeDialog({
	open,
	onOpenChange,
	accountId,
	clientId,
	propertyId,
	currency,
	defaultDueDate,
	applicantName,
}: {
	open: boolean
	onOpenChange: (next: boolean) => void
	accountId: string
	clientId: string
	propertyId: string
	currency: string
	defaultDueDate: string
	applicantName: string
}) {
	const queryClient = useQueryClient()
	const createCharge = useCreateCharge()
	const [category, setCategory] = useState<Nullable<ChargeCategory>>(null)
	const [name, setName] = useState('')
	const [amount, setAmount] = useState('')
	const [due, setDue] = useState(defaultDueDate.slice(0, 10))
	const [busy, setBusy] = useState(false)

	const chosen = FEE_TYPES.find((type) => type.category === category)
	const minor = convertCedisToPesewas(
		Number.parseFloat(amount.replace(/,/g, '')) || 0,
	)
	const ready = Boolean(category) && minor > 0 && name.trim().length > 0

	const save = async () => {
		if (!ready || !category) return
		setBusy(true)
		try {
			await createCharge.mutateAsync({
				client_id: clientId,
				property_id: propertyId,
				account_id: accountId,
				data: {
					name: name.trim(),
					category,
					amount: minor,
					currency,
					due_date: new Date(due).toISOString(),
				},
			})
			toast.success('Fee added.')
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
			})
			setCategory(null)
			setName('')
			setAmount('')
			onOpenChange(false)
		} catch {
			toast.error('Could not add the fee. Please try again.')
		} finally {
			setBusy(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add a fee</DialogTitle>
					<DialogDescription>
						A one-off amount on top of {applicantName}&rsquo;s rent. It goes
						onto the next bill once the date you set has passed.
					</DialogDescription>
				</DialogHeader>

				<div>
					<Label>What&rsquo;s it for?</Label>
					<div className="mt-2 flex flex-wrap gap-2">
						{FEE_TYPES.map((type) => (
							<Button
								key={type.category}
								variant={category === type.category ? 'default' : 'outline'}
								size="sm"
								onClick={() => {
									setCategory(type.category)
									if (!name.trim() && type.category !== 'OTHER')
										setName(type.label)
								}}
							>
								<Plus className="size-3.5" />
								{type.label}
							</Button>
						))}
					</div>
					{chosen ? (
						<p className="text-muted-foreground mt-2 text-xs">{chosen.eg}</p>
					) : null}
				</div>

				<div>
					<Label htmlFor="fee-name">Call it</Label>
					<Input
						id="fee-name"
						className="mt-2"
						placeholder="e.g. Broken window pane"
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
					<p className="text-muted-foreground mt-1.5 text-xs">
						{applicantName} sees this on the bill.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<Label htmlFor="fee-amount">How much?</Label>
						<div className="mt-2 flex items-center gap-2">
							<span className="text-muted-foreground text-sm font-semibold">
								{currency}
							</span>
							<Input
								id="fee-amount"
								inputMode="decimal"
								placeholder="0.00"
								value={amount}
								onChange={(event) => setAmount(event.target.value)}
							/>
						</div>
					</div>
					<div>
						<Label htmlFor="fee-due">When should they pay it?</Label>
						<Input
							id="fee-due"
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
						A fee can&rsquo;t be edited once it&rsquo;s added — if the amount is
						wrong, remove it and add another. Removed fees stay on the record
						but stop counting.
					</AlertDescription>
				</Alert>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button id="save-fee" disabled={!ready || busy} onClick={save}>
						{busy ? <Spinner /> : null}
						Add this fee
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
