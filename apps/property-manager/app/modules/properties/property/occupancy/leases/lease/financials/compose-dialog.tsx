import { useQueryClient } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useComposeInvoice } from '~/api/financial-accounts'
import {
	AlreadyBilledNotice,
	ChargePicker,
	claimable,
} from '~/components/blocks/financials/charge-picker'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Spinner } from '~/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { QUERY_KEYS } from '~/lib/constants'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface ComposeDialogProps {
	open: boolean
	summary: AccountSummary
	clientId: string
	propertyId: string
	onClose: () => void
	/** Hands the issued invoice on so the payment can be recorded against it. */
	onIssued: (invoice: Invoice) => void
}

/** The invoice's due date defaults to the earliest charge on it. */
const earliestDue = (
	summary: AccountSummary,
	picked: Record<string, number>,
) => {
	const dates = summary.charges
		.filter((charge) => picked[charge.id])
		.map((charge) => Date.parse(charge.due_date))
	return dates.length ? new Date(Math.min(...dates)) : null
}

/**
 * Bills charges by hand.
 *
 * Without this a MANUAL account is a dead end: payment is only ever recorded
 * against an invoice, and on a manual plan the sweep never issues one — so the
 * charges could never be billed and never be collected. It is also the answer
 * to an ad-hoc charge the landlord doesn't want to wait a cycle to bill.
 *
 * Composing bills; it settles nothing. The invoice it creates is where payment
 * is then recorded.
 */
export function ComposeDialog({
	open,
	summary,
	clientId,
	propertyId,
	onClose,
	onIssued,
}: ComposeDialogProps) {
	const queryClient = useQueryClient()
	const compose = useComposeInvoice()
	const [picked, setPicked] = useState<Record<string, number>>({})
	const [tab, setTab] = useState<'amount' | 'charges'>('amount')
	const [excess, setExcess] = useState(0)

	const currency = summary.account.currency
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)
	const total = Object.values(picked).reduce((sum, value) => sum + value, 0)

	const billable = summary.charges.filter(
		(charge) => !charge.voided_at && claimable(charge) > 0,
	)

	const close = () => {
		setPicked({})
		setTab('amount')
		setExcess(0)
		onClose()
	}

	const submit = () => {
		const due = earliestDue(summary, picked)
		compose.mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				account_id: summary.account.id,
				data: {
					claims: Object.entries(picked).map(([id, value]) => ({
						charge_instance_id: id,
						amount: value,
					})),
					due_date: due ? due.toISOString() : undefined,
					// Issued straight away: a draft nobody can pay is not a step the
					// landlord asked for.
					issue: true,
				},
			},
			{
				onSuccess: (invoice) => {
					toast.success(`${invoice.code} issued for ${money(total)}.`)
					// Straight into the payment: the landlord asked to pay these
					// charges, and the invoice was only the required intermediate step.
					onIssued(invoice)
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.INVOICES],
					})
					close()
				},
				onError: (error: Error) =>
					toast.error(
						error.message === 'ClaimExceedsChargeBalance'
							? 'One of those charges is already on an invoice. Refresh and try again.'
							: 'Could not create the invoice. Nothing was billed.',
					),
			},
		)
	}

	return (
		<Dialog open={open} onOpenChange={(next) => !next && close()}>
			{/* flex + a min-h-0 scroller, not overflow on the whole panel: scrolling
			    the panel takes the footer with it, and the buttons have to stay
			    reachable however many charges are listed. */}
			<DialogContent className="flex max-h-[85svh] flex-col sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Pay charges</DialogTitle>
					<DialogDescription>
						Pick what the tenant is paying for. The charges go onto one invoice,
						it is issued, and the payment is recorded against it next — money
						always lands on an invoice, never on a charge directly.
					</DialogDescription>
				</DialogHeader>

				{billable.length === 0 ? (
					<p className="text-muted-foreground min-h-0 flex-1 py-6 text-sm">
						Every charge is either settled or already on an invoice. Add a
						charge first if you need to bill something new.
					</p>
				) : (
					// Two ways in, one selection. Most of the time the landlord is handed
					// a figure and wants it applied oldest-first; occasionally they need
					// to say exactly which charges. Both write to `picked`, so switching
					// tabs keeps the work — type an amount, then tune it.
					<Tabs
						value={tab}
						onValueChange={(next) => setTab(next as 'amount' | 'charges')}
						className="flex min-h-0 flex-1 flex-col gap-3"
					>
						{/* Above the tabs: the omission is true of both, so it would
						    otherwise be said twice or look like a difference between them. */}
						<AlreadyBilledNotice summary={summary} mode="bill" />

						<TabsList className="shrink-0 self-start">
							<TabsTrigger value="amount">By amount</TabsTrigger>
							<TabsTrigger value="charges">Pick charges</TabsTrigger>
						</TabsList>

						<div className="min-h-0 flex-1 overflow-y-auto">
							{/* forceMount so the typed amount survives a trip to the other
							    tab — Radix unmounts inactive content by default. */}
							<TabsContent
								value="amount"
								forceMount
								className="data-[state=inactive]:hidden"
							>
								<ChargePicker
									summary={summary}
									picked={picked}
									setPicked={setPicked}
									mode="bill"
									control="amount"
									onExceeds={setExcess}
								/>
							</TabsContent>
							<TabsContent
								value="charges"
								forceMount
								className="data-[state=inactive]:hidden"
							>
								<ChargePicker
									summary={summary}
									picked={picked}
									setPicked={setPicked}
									mode="bill"
									control="list"
								/>
							</TabsContent>
						</div>
					</Tabs>
				)}

				<DialogFooter className="shrink-0 border-t pt-4 sm:items-center sm:justify-between">
					<p
						className={`min-w-0 flex-1 text-sm ${excess > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
					>
						{excess > 0 ? (
							<>
								Too much by {money(excess)} — nothing left to bill it against.
							</>
						) : total > 0 ? (
							<>
								<span className="text-foreground font-semibold">
									{money(total)}
								</span>{' '}
								on {Object.keys(picked).length}{' '}
								{Object.keys(picked).length === 1 ? 'charge' : 'charges'}
							</>
						) : (
							'Nothing selected yet.'
						)}
					</p>
					<div className="flex gap-2">
						<Button variant="outline" onClick={close}>
							Cancel
						</Button>
						<Button
							disabled={total <= 0 || excess > 0 || compose.isPending}
							onClick={submit}
						>
							{compose.isPending ? (
								<Spinner />
							) : (
								<FileText className="size-4" />
							)}
							Bill and pay
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
