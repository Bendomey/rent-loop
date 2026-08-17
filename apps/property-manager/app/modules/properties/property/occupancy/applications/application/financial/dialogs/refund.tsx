import { useQueryClient } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatDay } from '../../move-in/term'
import { useCreateCharge } from '~/api/financial-accounts'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { cn } from '~/lib/utils'

/**
 * Give money back.
 *
 * A refund is a negative charge that names the charge it reverses — there is
 * no separate refund record and no refund-specific category. The server caps
 * each one at what was actually settled, so money never received cannot be
 * refunded, and picking here is picking from what was actually paid.
 */
export function RefundDialog({
	open,
	onOpenChange,
	summary,
	clientId,
	propertyId,
	applicantName,
}: {
	open: boolean
	onOpenChange: (next: boolean) => void
	summary: AccountSummary
	clientId: string
	propertyId: string
	applicantName: string
}) {
	const queryClient = useQueryClient()
	const createCharge = useCreateCharge()
	const [picked, setPicked] = useState<Record<string, number>>({})
	const [busy, setBusy] = useState(false)

	const currency = summary.account.currency
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	// Only what was actually paid can be given back. Refunds themselves are
	// negative charges, so they are excluded rather than offered for re-refund.
	const refundable = summary.charges
		.filter(
			(charge) =>
				!charge.voided_at && charge.amount > 0 && charge.settled_amount > 0,
		)
		.sort(
			(a, b) =>
				new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
		)

	const total = Object.values(picked).reduce((sum, value) => sum + value, 0)

	const toggle = (charge: ChargeInstance) => {
		const next = { ...picked }
		if (next[charge.id]) delete next[charge.id]
		else next[charge.id] = charge.settled_amount
		setPicked(next)
	}

	const save = async () => {
		if (!total) return
		setBusy(true)

		// One negative charge per refunded charge, so each names what it
		// reverses. A failure part-way leaves the ones already created — say
		// which, rather than implying none landed.
		const failed: string[] = []
		for (const [id, amount] of Object.entries(picked)) {
			const charge = refundable.find((c) => c.id === id)
			if (!charge) continue
			try {
				await createCharge.mutateAsync({
					client_id: clientId,
					property_id: propertyId,
					account_id: summary.account.id,
					data: {
						name: `Refund — ${charge.name}`,
						category: charge.category,
						amount: -amount,
						currency,
						due_date: new Date().toISOString(),
						reverses_charge_instance_id: charge.id,
					},
				})
			} catch {
				failed.push(charge.name)
			}
		}

		setBusy(false)
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
		})

		if (failed.length > 0) {
			toast.error(
				`Some refunds could not be recorded: ${failed.join(', ')}. The others went through.`,
			)
			return
		}
		toast.success(`${money(total)} refunded to ${applicantName}.`)
		setPicked({})
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[88vh] flex-col sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>What are you giving back?</DialogTitle>
					<DialogDescription>
						Pick what {applicantName} paid that you&rsquo;re returning. You can
						only give back money that actually came in.
					</DialogDescription>
				</DialogHeader>

				<div className="min-h-0 flex-1 overflow-y-auto">
					<div className="rounded-xl border px-4">
						{refundable.map((charge, index) => {
							const on = Boolean(picked[charge.id])
							return (
								<button
									key={charge.id}
									type="button"
									onClick={() => toggle(charge)}
									className={cn(
										'flex w-full items-center gap-3 py-3 text-left',
										index === 0 ? '' : 'border-t',
									)}
								>
									<Checkbox checked={on} className="pointer-events-none" />
									<span className="min-w-0 flex-1">
										<span className="block truncate text-sm font-semibold">
											{charge.name}
										</span>
										<span className="text-muted-foreground mt-0.5 block text-xs">
											Paid · due {formatDay(new Date(charge.due_date))}
										</span>
									</span>
									<span
										className={cn(
											'text-sm font-semibold whitespace-nowrap',
											on ? '' : 'text-muted-foreground',
										)}
									>
										{money(charge.settled_amount)}
									</span>
								</button>
							)
						})}
						{refundable.length === 0 ? (
							<p className="text-muted-foreground py-6 text-center text-sm">
								{applicantName} hasn&rsquo;t paid anything yet, so there is
								nothing to give back.
							</p>
						) : null}
					</div>

					<Alert className="mt-4">
						<Info className="size-4" />
						<AlertDescription>
							A refund is recorded against the original charge and shows on the
							account as money going back out. It doesn&rsquo;t move the money
							itself — send that however {applicantName} paid you.
						</AlertDescription>
					</Alert>
				</div>

				<div className="flex flex-wrap items-center gap-3 border-t pt-4">
					<span className="flex-1 text-sm font-semibold">
						Refunding{' '}
						<span
							className={cn(
								'text-lg',
								total ? '' : 'text-muted-foreground font-normal',
							)}
						>
							{money(total)}
						</span>
					</span>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button id="save-refund" disabled={!total || busy} onClick={save}>
						{busy ? <Spinner /> : null}
						Record this refund
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
