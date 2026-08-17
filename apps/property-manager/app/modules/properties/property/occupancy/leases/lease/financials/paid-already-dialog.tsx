import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { cn } from '~/lib/utils'

const day = (value: Date | string) =>
	new Date(value).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC',
	})

interface PaidAlreadyDialogProps {
	/** The fee that was just added. Null closes the dialog. */
	charge: Nullable<ChargeInstance>
	currency: string
	tenantName: string
	/** When the plan will next issue, so "later" can name a date. */
	nextIssueOn: Nullable<Date>
	/** Chosen "yes" — the caller opens the payment step for this fee. */
	onCollect: () => void
	onClose: () => void
}

/**
 * Asked straight after a fee is saved.
 *
 * Adding a fee and taking the money for it are usually one errand — you fix
 * the handle, they hand over the cash — so this asks rather than making the
 * landlord go and find the fee again to record against it.
 *
 * A choice, not two buttons that fire on touch: both answers are ordinary, and
 * one of them bills money. Picking and then confirming leaves room to change
 * your mind, and "Not now" is always a safe exit because the fee is already
 * saved by the time this appears.
 */
export function PaidAlreadyDialog({
	charge,
	currency,
	tenantName,
	nextIssueOn,
	onCollect,
	onClose,
}: PaidAlreadyDialogProps) {
	const [pick, setPick] = useState<Nullable<'yes' | 'no'>>(null)

	// Each fee gets its own question — a previous answer must not carry over.
	useEffect(() => {
		if (charge) setPick(null)
	}, [charge])

	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const options = [
		{
			key: 'yes' as const,
			label: `Yes — ${tenantName} has handed over the money`,
			sub: charge
				? `Records ${money(charge.amount)} against this fee right now, so it never shows as owed.`
				: '',
		},
		{
			key: 'no' as const,
			label: `No — ${tenantName} will pay it later`,
			sub: nextIssueOn
				? `It goes on the ${day(nextIssueOn)} bill once the due date passes.`
				: 'It waits on their account until you bill for it.',
		},
	]

	return (
		<Dialog open={Boolean(charge)} onOpenChange={(next) => !next && onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader className="text-left">
					<DialogTitle>Fee added</DialogTitle>
					<DialogDescription>
						{charge ? (
							<>
								<span className="text-foreground font-semibold">
									{charge.name} · {money(charge.amount)}
								</span>{' '}
								is on {tenantName}&rsquo;s account, due {day(charge.due_date)}.
							</>
						) : null}
					</DialogDescription>
				</DialogHeader>

				<p className="font-bold">Have they paid it already?</p>

				<div className="flex flex-col gap-2.5">
					{options.map((option) => (
						<button
							key={option.key}
							type="button"
							aria-pressed={pick === option.key}
							onClick={() => setPick(option.key)}
							className={cn(
								'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
								pick === option.key
									? 'border-primary bg-primary/5'
									: 'hover:bg-muted/50',
							)}
						>
							<span
								className={cn(
									'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
									pick === option.key
										? 'border-primary bg-primary text-primary-foreground'
										: '',
								)}
							>
								{pick === option.key ? <Check className="size-3" /> : null}
							</span>
							<span className="min-w-0 flex-1">
								<span className="block font-semibold">{option.label}</span>
								<span className="text-muted-foreground mt-0.5 block text-sm">
									{option.sub}
								</span>
							</span>
						</button>
					))}
				</div>

				<div className="flex justify-end gap-2 border-t pt-4">
					<Button variant="outline" onClick={onClose}>
						Not now
					</Button>
					<Button
						id="fee-paid-confirm"
						onClick={pick === 'yes' ? onCollect : onClose}
					>
						{pick === 'yes' ? `Take their payment` : 'Done'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
