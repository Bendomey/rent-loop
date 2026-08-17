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
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import { convertCedisToPesewas } from '~/lib/format-amount'
import { cn } from '~/lib/utils'

/**
 * Fee types as a landlord would say them.
 *
 * The ledger's categories leak accounting vocabulary a landlord has no reason
 * to know — VAT and early-termination fees are not things you add by hand
 * mid-tenancy, and RENT never is: rent comes from the term. The mapping to the
 * stored category stays internal to this list.
 */
const FEE_TYPES: Array<{
	category: ChargeCategory
	label: string
	example: string
}> = [
	{
		category: 'DAMAGE_CHARGE',
		label: 'Repair or damage',
		example: 'e.g. Broken window pane',
	},
	{
		category: 'UTILITY',
		label: 'Water or electricity',
		example: 'e.g. Water · Oct–Nov',
	},
	{
		category: 'SECURITY_DEPOSIT',
		label: 'Security deposit',
		example: 'Refunded when they leave',
	},
	{ category: 'AGENCY_FEE', label: 'Agency fee', example: 'Your commission' },
	{ category: 'OTHER', label: 'Something else', example: 'You name it' },
]

const isoDay = (value: Date | string) =>
	new Date(value).toISOString().slice(0, 10)

const day = (value: Date | string) =>
	new Date(value).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC',
	})

interface AddFeeDialogProps {
	open: boolean
	accountId: string
	clientId: string
	propertyId: string
	currency: string
	tenantName: string
	/** When the plan will next issue, so the fee's fate can name a date. */
	nextIssueOn: Nullable<Date>
	onClose: () => void
	/** Handed the saved fee, so the caller can ask whether it is already paid. */
	onAdded: (charge: ChargeInstance) => void
}

/**
 * A one-off amount on top of rent.
 *
 * Nothing is preselected. The old dialog opened on "Security deposit" with the
 * name pre-filled to match, so a landlord adding a repair and not noticing
 * recorded it as a refundable deposit — a mistake with real money attached,
 * made by doing nothing.
 *
 * There is no "bill it now" here either. Whether the money is already in hand
 * is a separate question, asked after the fee is safely saved, because that is
 * the question a landlord can actually answer.
 */
export function AddFeeDialog({
	open,
	accountId,
	clientId,
	propertyId,
	currency,
	tenantName,
	nextIssueOn,
	onClose,
	onAdded,
}: AddFeeDialogProps) {
	const queryClient = useQueryClient()
	const createCharge = useCreateCharge()

	const [category, setCategory] = useState<Nullable<ChargeCategory>>(null)
	const [name, setName] = useState('')
	const [amount, setAmount] = useState('')
	const [due, setDue] = useState(isoDay(new Date()))

	const chosen = FEE_TYPES.find((type) => type.category === category)
	const minor = convertCedisToPesewas(
		Number.parseFloat(amount.replace(/,/g, '')) || 0,
	)
	const ready = Boolean(category) && minor > 0 && name.trim().length > 0

	const reset = () => {
		setCategory(null)
		setName('')
		setAmount('')
		setDue(isoDay(new Date()))
	}

	const add = () => {
		if (!category) return
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
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.INVOICES],
					})
					reset()
					onClose()
					onAdded(charge)
				},
				onError: () => toast.error('Could not add the fee. Please try again.'),
			},
		)
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					reset()
					onClose()
				}
			}}
		>
			<DialogContent className="flex max-h-[90svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
				<DialogHeader className="shrink-0 border-b p-5 text-left">
					<DialogTitle>Add a fee</DialogTitle>
					<DialogDescription>
						A one-off amount on top of {tenantName}&rsquo;s rent. It goes onto
						their next bill once the date you set has passed
						{nextIssueOn ? (
							<>
								{' '}
								— that bill is due to go out on{' '}
								<span className="text-foreground font-semibold">
									{day(nextIssueOn)}
								</span>
							</>
						) : null}
						.
					</DialogDescription>
				</DialogHeader>

				<div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
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
										// Naming it for them, except when the type is
										// "Something else" — which says nothing worth
										// putting on a bill.
										if (!name.trim() && type.category !== 'OTHER')
											setName(type.label)
									}}
								>
									{type.label}
								</Button>
							))}
						</div>
						{chosen ? (
							<p className="text-muted-foreground mt-2.5 text-xs">
								{chosen.example}
							</p>
						) : null}
					</div>

					<div>
						<Label htmlFor="fee-name">
							Call it{' '}
							<span className="text-muted-foreground font-normal">
								{category
									? 'they’ll see this on their bill'
									: 'pick what it’s for first'}
							</span>
						</Label>
						<Input
							id="fee-name"
							className="mt-1.5"
							placeholder="e.g. Broken window pane"
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						<div>
							<Label htmlFor="fee-amount">How much?</Label>
							<div className="mt-1.5 flex items-center gap-2">
								<span className="text-muted-foreground text-sm font-semibold">
									GH₵
								</span>
								<Input
									id="fee-amount"
									inputMode="decimal"
									placeholder="0.00"
									className="flex-1 font-semibold"
									value={amount}
									onChange={(event) => setAmount(event.target.value)}
								/>
							</div>
						</div>
						<div>
							<Label htmlFor="fee-due">
								Due{' '}
								<span className="text-muted-foreground font-normal">
									when should they pay it?
								</span>
							</Label>
							<Input
								id="fee-due"
								type="date"
								className="mt-1.5"
								value={due}
								onChange={(event) => setDue(event.target.value)}
							/>
						</div>
					</div>

					<Alert>
						<Info className="size-4" />
						<AlertDescription>
							You can&rsquo;t edit a fee once it&rsquo;s added — if you get the
							amount wrong, remove it and add another. Removed fees stay on the
							record but stop counting.
						</AlertDescription>
					</Alert>
				</div>

				<div className="bg-background flex shrink-0 justify-end gap-2 border-t p-5">
					<Button
						variant="outline"
						onClick={() => {
							reset()
							onClose()
						}}
					>
						Cancel
					</Button>
					<Button
						id="save-fee"
						disabled={!ready || createCharge.isPending}
						onClick={add}
						className={cn(!ready && 'pointer-events-none')}
					>
						{createCharge.isPending ? <Spinner /> : <Plus className="size-4" />}
						Add this fee
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
