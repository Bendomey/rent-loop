import { useQueryClient } from '@tanstack/react-query'
import { Check, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { remainingOn } from './account'
import { usePayInvoice } from '~/api/financial-accounts'
import { useGetPaymentAccounts } from '~/api/payment-accounts'
import { PAYMENT_PROVIDERS } from '~/components/blocks/financials/payment-providers'
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

interface PayDialogProps {
	invoice: Nullable<Invoice>
	clientId: string
	propertyId: string
	currency: string
	tenantName: string
	onClose: () => void
}

const day = (value: Date | string) =>
	new Date(value).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})

/**
 * Recording money against a bill.
 *
 * Payment is always recorded against a bill — the same rule as the
 * application. Two columns so the form is never pushed below the fold: what
 * the bill is for on the left, what you are recording on the right, and the
 * verdict pinned at the bottom where it is read. On a phone the columns stack
 * and the footer stays put, so the submit is reachable without scrolling past
 * the bill.
 */
export function PayDialog({
	invoice,
	clientId,
	propertyId,
	currency,
	tenantName,
	onClose,
}: PayDialogProps) {
	const queryClient = useQueryClient()
	const pay = usePayInvoice()

	const balance = invoice ? remainingOn(invoice) : 0
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

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

	// Opening on a different bill re-arms the form with that balance.
	useEffect(() => {
		if (invoice) setAmount(String(convertPesewasToCedis(remainingOn(invoice))))
	}, [invoice])

	useEffect(() => {
		if (!paymentAccountId && offlineAccounts[0])
			setPaymentAccountId(offlineAccounts[0].id)
	}, [offlineAccounts, paymentAccountId])

	const entered = convertCedisToPesewas(
		Number.parseFloat(amount.replace(/,/g, '')) || 0,
	)
	const over = entered > balance
	const short = entered > 0 && entered < balance

	const useBalance = () => setAmount(String(convertPesewasToCedis(balance)))

	const record = () => {
		if (!invoice) return
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
					toast.success(`Payment of ${money(entered)} recorded.`)
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.INVOICES],
					})
					setReference('')
					onClose()
				},
				onError: (error: Error) =>
					toast.error(
						error.message === 'PaymentExceedsInvoiceBalance'
							? 'That is more than the bill has left on it.'
							: 'Could not record the payment. Please try again.',
					),
			},
		)
	}

	const lines = invoice?.line_items ?? []

	// The same "A, B and C" phrasing the hero uses for a late bill, built from
	// the line labels rather than the ledger, since that is what was billed.
	const names = lines.map((line) => line.label)
	const what =
		names.length === 0
			? 'this tenancy'
			: names.length === 1
				? names[0]
				: `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

	return (
		<Dialog open={Boolean(invoice)} onOpenChange={(next) => !next && onClose()}>
			<DialogContent className="flex max-h-[90svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
				<DialogHeader className="shrink-0 border-b p-5 text-left">
					<DialogTitle>What did {tenantName} pay for?</DialogTitle>
					<DialogDescription>
						{invoice ? (
							<>
								{/*
								 * Named by what it is for, not by its code or its send
								 * date: "INV-2611-0042" and "the bill sent 3 Nov" both
								 * make the landlord go and check which one that was.
								 */}
								This bill is for{' '}
								<span className="text-foreground font-semibold">{what}</span> —{' '}
								<span className="text-foreground font-semibold">
									{money(balance)}
								</span>
								{invoice.due_date ? `, due ${day(invoice.due_date)}` : null}.
							</>
						) : null}
					</DialogDescription>
				</DialogHeader>

				{invoice ? (
					<div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto sm:grid-cols-2 sm:overflow-hidden">
						{/* ── what the bill is for ──────────────────────────────── */}
						<div className="bg-muted/40 min-h-0 border-b p-5 sm:overflow-y-auto sm:border-r sm:border-b-0">
							<p className="text-muted-foreground text-sm">
								What this bill is for
							</p>
							<div className="mt-3 flex flex-col">
								{lines.map((line, index) => (
									<div
										key={line.id}
										className={cn(
											'flex items-center gap-3 py-2.5',
											index > 0 ? 'border-t' : '',
										)}
									>
										<span className="min-w-0 flex-1 text-sm">{line.label}</span>
										<span className="text-sm font-semibold tabular-nums">
											{money(line.total_amount)}
										</span>
									</div>
								))}
							</div>
							<div className="mt-2 flex items-center gap-3 border-t pt-3">
								<span className="min-w-0 flex-1 text-sm font-bold">
									Still owed on it
								</span>
								<span className="font-bold tabular-nums">{money(balance)}</span>
							</div>
						</div>

						{/* ── what you are recording ────────────────────────────── */}
						<div className="min-h-0 space-y-4 p-5 sm:overflow-y-auto">
							<div>
								<Label htmlFor="pay-amount">How much did they hand over?</Label>
								<div className="mt-1.5 flex items-center gap-2">
									<span className="text-muted-foreground text-sm font-semibold">
										GH₵
									</span>
									<Input
										id="pay-amount"
										inputMode="decimal"
										className="flex-1 text-lg font-bold"
										value={amount}
										onChange={(event) => setAmount(event.target.value)}
									/>
								</div>
								{/* The correct figure is always one tap away, whichever
								    side of the balance the entered amount falls. */}
								{entered !== balance ? (
									<Button
										variant="outline"
										size="sm"
										className="mt-2"
										onClick={useBalance}
									>
										<Check className="size-4" />
										They paid it all · {money(balance)}
									</Button>
								) : null}
							</div>

							{/* First combobox in the dialog on purpose — an account must
							    be chosen before the submit arms. */}
							<div>
								<Label>Mode of payment?</Label>
								<Select
									value={paymentAccountId}
									onValueChange={setPaymentAccountId}
								>
									<SelectTrigger className="mt-1.5 w-full">
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

							<div className="grid gap-3 sm:grid-cols-2">
								<div>
									<Label>How did they pay?</Label>
									<Select value={provider} onValueChange={setProvider}>
										<SelectTrigger className="mt-1.5 w-full">
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
									<Label htmlFor="pay-reference">
										Receipt no.{' '}
										<span className="text-muted-foreground font-normal">
											optional
										</span>
									</Label>
									<Input
										id="pay-reference"
										className="mt-1.5 font-mono"
										placeholder="RCP-014"
										value={reference}
										onChange={(event) => setReference(event.target.value)}
									/>
								</div>
							</div>
						</div>
					</div>
				) : null}

				{/* Pinned: the verdict and the submit are the two things you come
				    back to, so they never scroll away. */}
				<div className="bg-background shrink-0 border-t p-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p
							className={cn(
								'flex min-w-48 flex-1 items-center gap-2 text-sm',
								over ? 'text-destructive' : 'text-muted-foreground',
							)}
						>
							{over ? <TriangleAlert className="size-4 shrink-0" /> : null}
							{over
								? `That’s ${money(entered - balance)} more than this bill.`
								: short
									? `${tenantName} would still owe ${money(balance - entered)} on it.`
									: 'That clears this bill.'}
						</p>
						<div className="flex gap-2">
							<Button variant="outline" onClick={onClose}>
								Cancel
							</Button>
							<Button
								disabled={
									over || entered <= 0 || !paymentAccountId || pay.isPending
								}
								onClick={record}
							>
								{pay.isPending ? <Spinner /> : null}
								Save this payment
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
