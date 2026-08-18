import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatDay } from '../../move-in/term'
import { useComposeInvoice, usePayInvoice } from '~/api/financial-accounts'
import { useGetPaymentAccounts } from '~/api/payment-accounts'
import { PAYMENT_PROVIDERS } from '~/components/blocks/financials/payment-providers'
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
import { cn } from '~/lib/utils'

/** What no invoice has claimed yet. A charge can only be invoiced once. */
const uninvoiced = (charge: ChargeInstance) =>
	charge.amount - charge.invoiced_amount

/**
 * "What did {Name} pay for?"
 *
 * Two ways in, because landlords arrive from two directions: they either know
 * what the money was for, or they know how much came in. Ticking the charges
 * and typing the amount are the same choice made from either end — typing
 * fills the oldest due first, which is the same walk the backend does when it
 * settles an invoice's lines.
 *
 * Two columns so the form and the submit never get pushed below a long list of
 * charges: what is being paid on the left, how it was paid on the right.
 */
export function RecordPaymentDialog({
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
	const compose = useComposeInvoice()
	const pay = usePayInvoice()
	const [picked, setPicked] = useState<Record<string, number>>({})
	const [typed, setTyped] = useState('')
	const [provider, setProvider] = useState('CASH')
	const [accountId, setAccountId] = useState<string>('')
	const [busy, setBusy] = useState(false)

	const { data: accounts } = useGetPaymentAccounts(clientId, {
		pagination: { page: 1, per: 50 },
		sorter: {},
		search: {},
		filters: { owner_types: ['PROPERTY_OWNER', 'SYSTEM'] },
	})

	const currency = summary.account.currency
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	// Not voided, not settled, and nothing an invoice has already claimed.
	const claimable = summary.charges
		.filter(
			(charge) =>
				!charge.voided_at &&
				charge.settled_amount < charge.amount &&
				uninvoiced(charge) > 0,
		)
		.sort(
			(a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
		)

	const total = Object.values(picked).reduce((sum, value) => sum + value, 0)
	const everything = claimable.reduce(
		(sum, charge) => sum + uninvoiced(charge),
		0,
	)
	const chosenAccount = accountId || accounts?.rows?.[0]?.id || ''

	const toggle = (charge: ChargeInstance) => {
		const next = { ...picked }
		if (next[charge.id]) delete next[charge.id]
		else next[charge.id] = uninvoiced(charge)
		setPicked(next)
		setTyped('')
	}

	/**
	 * Typing an amount ticks charges oldest-due-first — the same order payment
	 * settles an invoice's lines in, so what the landlord sees ticked is what
	 * the money will actually cover.
	 */
	const applyTyped = (value: string) => {
		setTyped(value)
		let left = convertCedisToPesewas(
			Number.parseFloat(value.replace(/,/g, '')) || 0,
		)
		const next: Record<string, number> = {}
		for (const charge of claimable) {
			if (left <= 0) break
			const take = Math.min(uninvoiced(charge), left)
			next[charge.id] = take
			left -= take
		}
		setPicked(next)
	}

	const save = async () => {
		if (!total || !chosenAccount) return
		setBusy(true)
		try {
			const invoice = await compose.mutateAsync({
				client_id: clientId,
				property_id: propertyId,
				account_id: summary.account.id,
				data: {
					claims: Object.entries(picked).map(([id, amount]) => ({
						charge_instance_id: id,
						amount,
					})),
					issue: true,
				},
			})

			await pay.mutateAsync({
				client_id: clientId,
				property_id: propertyId,
				invoice_id: invoice.id,
				data: {
					payment_account_id: chosenAccount,
					amount: total,
					provider,
				},
			})

			toast.success(`${money(total)} recorded. A receipt is on its way.`)
			setPicked({})
			setTyped('')
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
			})
			void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
			onOpenChange(false)
		} catch (error) {
			const message = (error as Error).message
			toast.error(
				message === 'PaymentExceedsInvoiceBalance'
					? 'That is more than the bill has left on it.'
					: message === 'ClaimExceedsChargeBalance'
						? 'One of those is already on a bill. Refresh and try again.'
						: 'Could not record the payment. Please try again.',
			)
		} finally {
			setBusy(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{/* A column with one scrolling region: the list can be long, but the
			    total and the submit must never be scrolled off — on a phone that
			    left the button below the fold entirely. */}
			<DialogContent className="flex max-h-[88vh] flex-col sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>What did {applicantName} pay for?</DialogTitle>
					<DialogDescription>
						Tick what the money covers, or type what came in and we&rsquo;ll
						work it out from the oldest first.
					</DialogDescription>
				</DialogHeader>

				<div className="grid min-h-0 flex-1 gap-6 overflow-y-auto md:grid-cols-[1fr_260px]">
					{/* ── what is being paid ─────────────────────────────────────── */}
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<Label htmlFor="paid-amount" className="shrink-0">
								They paid
							</Label>
							<span className="text-muted-foreground text-sm font-semibold">
								{currency}
							</span>
							<Input
								id="paid-amount"
								inputMode="decimal"
								className="w-32 font-semibold"
								placeholder="0.00"
								value={typed}
								onChange={(event) => applyTyped(event.target.value)}
							/>
							<span className="text-muted-foreground text-xs">
								fills the oldest first
							</span>
						</div>

						<div className="mt-3 rounded-xl border px-4 md:max-h-64 md:overflow-y-auto">
							{claimable.map((charge, index) => {
								const on = Boolean(picked[charge.id])
								const part = on && picked[charge.id]! < uninvoiced(charge)
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
												Due {formatDay(new Date(charge.due_date))}
											</span>
										</span>
										{part ? (
											<span className="text-warning bg-warning-bg rounded-full px-2 py-0.5 text-[10px] font-bold">
												Part · {money(picked[charge.id]!)}
											</span>
										) : null}
										<span
											className={cn(
												'text-sm font-semibold whitespace-nowrap',
												on ? '' : 'text-muted-foreground',
											)}
										>
											{money(uninvoiced(charge))}
										</span>
									</button>
								)
							})}
							{claimable.length === 0 ? (
								<p className="text-muted-foreground py-6 text-center text-sm">
									Everything has been paid or is already on a bill.
								</p>
							) : null}
						</div>

						{claimable.length > 0 ? (
							<div className="mt-3 flex flex-wrap gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setPicked(
											Object.fromEntries(
												claimable.map((c) => [c.id, uninvoiced(c)]),
											),
										)
										setTyped(String(convertPesewasToCedis(everything)))
									}}
								>
									They paid everything · {money(everything)}
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setPicked({})
										setTyped('')
									}}
								>
									Clear
								</Button>
							</div>
						) : null}
					</div>

					{/* ── how it was paid. Never pushed below the list. ──────────── */}
					<div className="bg-muted/40 flex flex-col gap-4 rounded-xl p-4">
						<div>
							<Label htmlFor="pay-provider">How did they pay?</Label>
							<Select value={provider} onValueChange={setProvider}>
								<SelectTrigger id="pay-provider" className="mt-2 w-full">
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
							<Label htmlFor="pay-account">Mode of payment?</Label>
							<Select value={chosenAccount} onValueChange={setAccountId}>
								<SelectTrigger id="pay-account" className="mt-2 w-full">
									<SelectValue placeholder="Pick an account" />
								</SelectTrigger>
								<SelectContent>
									{(accounts?.rows ?? []).map((account) => (
										<SelectItem key={account.id} value={account.id}>
											{getPaymentAccountTypeLabel(account.rail)}
											{account.identifier ? ` · ${account.identifier}` : null}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3 border-t pt-4">
					<span className="flex-1 text-sm font-semibold">
						Recording{' '}
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
					<Button
						id="save-payment"
						disabled={!total || !chosenAccount || busy}
						onClick={save}
					>
						{busy ? <Spinner /> : null}
						Save this payment
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
