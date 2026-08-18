import { useQueryClient } from '@tanstack/react-query'
import { Info, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useComposeInvoice, usePayInvoice } from '~/api/financial-accounts'
import { useGetPaymentAccounts } from '~/api/payment-accounts'
import { PAYMENT_PROVIDERS } from '~/components/blocks/financials/payment-providers'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
	formatAmount,
} from '~/lib/format-amount'
import { getPaymentAccountTypeLabel } from '~/lib/payment-account.utils'
import { allocateOldestFirst, owedOn } from '~/lib/payment-allocation'
import { cn } from '~/lib/utils'

const day = (value: Date | string) =>
	new Date(value).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC',
	})

interface CollectDialogProps {
	/** Everything no bill has claimed yet, in due-date order. */
	charges: ChargeInstance[]
	open: boolean
	accountId: string
	clientId: string
	propertyId: string
	currency: string
	tenantName: string
	/**
	 * Start with everything ticked. True only when the landlord has already
	 * said this is paid — the fee flow — where asking them to tick the very
	 * thing they just confirmed is a step with no decision in it.
	 */
	preselect?: boolean
	/** Shown only when there is somewhere to go back to. */
	onBack?: () => void
	onClose: () => void
}

/**
 * Money for things no bill has gone out for.
 *
 * This works off the ledger, not the bills: a landlord being handed cash is
 * being paid for *rent* or *a repair*, and whether Rentloop has sent a bill for
 * it yet is an internal detail. Money against a bill already sent is recorded
 * on that bill, from its own row in the listing.
 *
 * Two ways in, because landlords arrive with either: tick what the money
 * covers, or type what came in and let the page fill from the oldest — which is
 * the order money is applied in anyway. Neither is preselected; a dialog that
 * opens with boxes already ticked invites a landlord to save an allocation
 * they never chose.
 *
 * Saving raises one issued bill claiming exactly what is ticked, then records
 * the payment against it. The two calls are not atomic, so a failure between
 * them leaves the charges billed and unpaid — a real state this page can show,
 * and one the message names rather than implying nothing happened.
 */
export function CollectDialog({
	charges,
	open,
	accountId,
	clientId,
	propertyId,
	currency,
	tenantName,
	preselect = false,
	onBack,
	onClose,
}: CollectDialogProps) {
	const queryClient = useQueryClient()
	const compose = useComposeInvoice()
	const pay = usePayInvoice()
	const busy = compose.isPending || pay.isPending

	const [picked, setPicked] = useState<string[]>([])
	const [amount, setAmount] = useState('')
	const [paymentAccountId, setPaymentAccountId] = useState('')
	const [provider, setProvider] = useState('CASH')
	const [reference, setReference] = useState('')

	const { data: accountPage } = useGetPaymentAccounts(clientId, {
		pagination: { page: 1, per: 100 },
		filters: {
			rail: 'OFFLINE',
			status: 'ACTIVE',
			owner_types: ['PROPERTY_OWNER', 'SYSTEM'],
		},
	})
	const offlineAccounts = (accountPage?.rows ?? []).filter(
		(account) => account.rail === 'OFFLINE' && account.status === 'ACTIVE',
	)

	// Blank on every opening — see the note above about pre-ticked boxes —
	// unless the landlord has already told us this one is paid.
	useEffect(() => {
		if (!open) return
		setReference('')
		if (preselect && charges.length > 0) {
			setPicked(charges.map((charge) => charge.id))
			setAmount(
				String(
					convertPesewasToCedis(
						charges.reduce((sum, charge) => sum + owedOn(charge), 0),
					),
				),
			)
			return
		}
		setPicked([])
		setAmount('')
	}, [open, preselect, charges])

	useEffect(() => {
		if (!paymentAccountId && offlineAccounts[0])
			setPaymentAccountId(offlineAccounts[0].id)
	}, [offlineAccounts, paymentAccountId])

	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const ordered = [...charges].sort(
		(a, b) => Date.parse(a.due_date) - Date.parse(b.due_date),
	)
	const everything = ordered.reduce((sum, charge) => sum + owedOn(charge), 0)

	const chosen = ordered.filter((charge) => picked.includes(charge.id))
	const claimed = chosen.reduce((sum, charge) => sum + owedOn(charge), 0)

	const entered = convertCedisToPesewas(
		Number.parseFloat(amount.replace(/,/g, '')) || 0,
	)
	// More money than the things it is being put against — the ledger has
	// nothing left to apply the remainder to.
	const over = entered > claimed
	const short = entered > 0 && entered < claimed

	/* Typing money picks the charges; ticking charges sets the money. Both are
	 * plain event handlers rather than effects watching each other, so neither
	 * can drive the other in a loop. */
	const typeAmount = (next: string) => {
		setAmount(next)
		const minor = convertCedisToPesewas(
			Number.parseFloat(next.replace(/,/g, '')) || 0,
		)
		setPicked(allocateOldestFirst(ordered, minor))
	}

	const toggle = (id: string) => {
		const next = picked.includes(id)
			? picked.filter((one) => one !== id)
			: [...picked, id]
		setPicked(next)
		const total = ordered
			.filter((charge) => next.includes(charge.id))
			.reduce((sum, charge) => sum + owedOn(charge), 0)
		setAmount(total > 0 ? String(convertPesewasToCedis(total)) : '')
	}

	const takeAll = () => {
		setPicked(ordered.map((charge) => charge.id))
		setAmount(String(convertPesewasToCedis(everything)))
	}

	const clear = () => {
		setPicked([])
		setAmount('')
	}

	const settle = () => {
		if (chosen.length === 0) return

		compose.mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				account_id: accountId,
				data: {
					claims: chosen.map((charge) => ({
						charge_instance_id: charge.id,
						amount: owedOn(charge),
					})),
					// Due on the furthest-out thing it covers — a bill cannot fall
					// due before what it is billing for.
					due_date: chosen
						.map((charge) => charge.due_date)
						.sort()
						.at(-1),
					issue: true,
				},
			},
			{
				onSuccess: (invoice) => {
					pay.mutate(
						{
							client_id: clientId,
							property_id: propertyId,
							invoice_id: invoice.id,
							data: {
								payment_account_id: paymentAccountId,
								amount: entered,
								provider,
								reference: reference.trim() || undefined,
							},
						},
						{
							onSuccess: () => {
								toast.success(`${money(entered)} recorded.`)
								void queryClient.invalidateQueries({
									queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
								})
								void queryClient.invalidateQueries({
									queryKey: [QUERY_KEYS.INVOICES],
								})
								onClose()
							},
							onError: () => {
								toast.warning(
									'A bill went out for these, but the payment could not be recorded. Record it against that bill.',
								)
								void queryClient.invalidateQueries({
									queryKey: [QUERY_KEYS.INVOICES],
								})
								onClose()
							},
						},
					)
				},
				onError: () =>
					toast.error(
						'Could not raise a bill for these. Nothing has been charged.',
					),
			},
		)
	}

	return (
		<Dialog
			open={open && charges.length > 0}
			onOpenChange={(next) => !next && onClose()}
		>
			<DialogContent className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
				<DialogHeader className="shrink-0 p-6 pb-4 text-left">
					<DialogTitle className="text-2xl">
						What did {tenantName} pay for?
					</DialogTitle>
					<DialogDescription>
						Tick what the money covers, or type what came in and we&rsquo;ll
						work it out from the oldest first.
					</DialogDescription>
				</DialogHeader>

				<div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto px-6 pb-2 lg:grid-cols-[1fr_320px] lg:overflow-hidden">
					{/* ── what the money covers ─────────────────────────────── */}
					<div className="flex flex-col gap-4 lg:min-h-0">
						<div className="flex flex-wrap items-center gap-3">
							<Label htmlFor="collect-amount" className="shrink-0">
								They paid
							</Label>
							<span className="text-muted-foreground text-sm font-semibold">
								{currency}
							</span>
							<Input
								id="collect-amount"
								inputMode="decimal"
								placeholder="0.00"
								className="w-40 text-lg font-bold"
								value={amount}
								onChange={(event) => typeAmount(event.target.value)}
							/>
							<span className="text-muted-foreground text-sm">
								fills the oldest first
							</span>
						</div>

						{/* The list scrolls inside its own box rather than pushing the
						    shortcuts below it out of view — a twelve-month run is long,
						    and "they paid everything" is the fastest answer there is. */}
						{/* Bounded only where the dialog body itself does not scroll. On
						    a phone the whole body scrolls, and capping the list there
						    collapses it to nothing inside the flex column. */}
						<div className="rounded-xl border px-4 lg:max-h-[42vh] lg:min-h-0 lg:overflow-y-auto">
							{ordered.map((charge, index) => (
								<label
									key={charge.id}
									data-charge={charge.id}
									className={cn(
										'flex cursor-pointer items-center gap-3 py-3.5',
										index > 0 ? 'border-t' : '',
									)}
								>
									<Checkbox
										checked={picked.includes(charge.id)}
										onCheckedChange={() => toggle(charge.id)}
										aria-label={charge.name}
									/>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-semibold">
											{charge.name}
										</span>
										<span className="text-muted-foreground mt-0.5 block text-sm">
											Due {day(charge.due_date)}
										</span>
									</span>
									<span className="font-semibold whitespace-nowrap">
										{money(owedOn(charge))}
									</span>
								</label>
							))}
						</div>

						<div className="flex flex-wrap gap-2">
							<Button variant="outline" onClick={takeAll}>
								They paid everything · {money(everything)}
							</Button>
							<Button
								variant="outline"
								onClick={clear}
								disabled={!picked.length}
							>
								Clear
							</Button>
						</div>

						{over ? (
							<Alert variant="destructive">
								<TriangleAlert className="size-4" />
								<AlertTitle>More than this covers</AlertTitle>
								<AlertDescription>
									What you&rsquo;ve ticked comes to {money(claimed)}. Tick
									something else it goes towards, or record {money(claimed)}{' '}
									here and the rest when their next bill goes out.
								</AlertDescription>
							</Alert>
						) : null}

						{short ? (
							<Alert>
								<Info className="size-4" />
								<AlertDescription>
									The remaining{' '}
									<b className="text-foreground">{money(claimed - entered)}</b>{' '}
									stays on the bill this raises, and {tenantName} still owes it.
								</AlertDescription>
							</Alert>
						) : null}
					</div>

					{/* ── how it reached you ────────────────────────────────── */}
					<div className="bg-muted/40 h-fit space-y-4 rounded-xl p-5">
						<div>
							<Label>How did they pay?</Label>
							<Select value={provider} onValueChange={setProvider}>
								<SelectTrigger className="bg-background mt-1.5 w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PAYMENT_PROVIDERS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label>Mode of payment?</Label>
							<Select
								value={paymentAccountId}
								onValueChange={setPaymentAccountId}
							>
								<SelectTrigger className="bg-background mt-1.5 w-full">
									<SelectValue placeholder="Choose an account" />
								</SelectTrigger>
								<SelectContent>
									{offlineAccounts.map((account) => (
										<SelectItem key={account.id} value={account.id}>
											{getPaymentAccountTypeLabel(account.rail)}
											{account.identifier ? ` · ${account.identifier}` : null}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor="collect-reference">
								Receipt no.{' '}
								<span className="text-muted-foreground font-normal">
									if you have one
								</span>
							</Label>
							<Input
								id="collect-reference"
								className="bg-background mt-1.5 font-mono"
								placeholder="RCP-015"
								value={reference}
								onChange={(event) => setReference(event.target.value)}
							/>
						</div>
					</div>
				</div>

				<div className="bg-background shrink-0 border-t p-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p className="flex min-w-48 flex-1 items-baseline gap-2">
							<span className="font-bold">Recording</span>
							<span
								className={cn(
									'text-2xl font-bold tracking-tight',
									entered > 0 ? '' : 'text-muted-foreground',
								)}
							>
								{money(entered)}
							</span>
						</p>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={onBack ?? onClose}
								disabled={busy}
							>
								{onBack ? 'Back' : 'Cancel'}
							</Button>
							<Button
								id="save-collect"
								disabled={
									over ||
									entered <= 0 ||
									chosen.length === 0 ||
									!paymentAccountId ||
									busy
								}
								onClick={settle}
							>
								{busy ? <Spinner /> : null}
								Save this payment
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
