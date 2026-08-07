import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { InvoiceTab, remainingOn } from './invoice-tab'
import { useComposeInvoice, usePayInvoice } from '~/api/financial-accounts'
import { useGetInvoices } from '~/api/invoices'
import { useGetPaymentAccounts } from '~/api/payment-accounts'
import {
	ChargePicker,
	claimable,
} from '~/components/blocks/financials/charge-picker'
import { PAYMENT_PROVIDERS } from '~/components/blocks/financials/payment-providers'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
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

interface CollectProps {
	summary: AccountSummary
	clientId: string
	propertyId: string
	readonly?: boolean
	/** Bumped when "whole term up front" is chosen — selects everything. */
	collectAllSignal: number
}

export function Collect({
	summary,
	clientId,
	propertyId,
	readonly,
	collectAllSignal,
}: CollectProps) {
	const queryClient = useQueryClient()
	const compose = useComposeInvoice()
	const pay = usePayInvoice()

	const currency = summary.account.currency
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	// Only account-backed invoices, and only ones still owed money. Payments has
	// to be populated — remainingOn subtracts them, so without it a part-paid
	// invoice offers its whole total as the amount still to collect.
	const { data: invoicePage } = useGetInvoices(clientId, propertyId, {
		pagination: { page: 1, per: 200 },
		filters: { financial_account_id: summary.account.id },
		populate: ['LineItems', 'Payments'],
	})
	const unpaid = (invoicePage?.rows ?? []).filter(
		(invoice) =>
			invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID',
	)
	const hasInvoices = unpaid.length > 0

	const { data: accountPage } = useGetPaymentAccounts(clientId, {
		pagination: { page: 1, per: 100 },
		filters: { rail: 'OFFLINE', status: 'ACTIVE' },
	})
	const offlineAccounts = (accountPage?.rows ?? []).filter(
		(account) => account.rail === 'OFFLINE' && account.status === 'ACTIVE',
	)

	const [tab, setTab] = useState<'invoice' | 'compose'>('compose')
	const [picked, setPicked] = useState<Record<string, number>>({})
	const [selectedInvoiceId, setSelectedInvoiceId] =
		useState<Nullable<string>>(null)
	const [invoiceAmount, setInvoiceAmount] = useState('')
	const [paymentAccountId, setPaymentAccountId] = useState('')
	const [provider, setProvider] = useState('CASH')
	const [reference, setReference] = useState('')
	const [busy, setBusy] = useState(false)

	// Whole term up front: take everything still claimable.
	useEffect(() => {
		if (collectAllSignal === 0) return
		const next: Record<string, number> = {}
		for (const charge of summary.charges) {
			if (!charge.voided_at && claimable(charge) > 0)
				next[charge.id] = claimable(charge)
		}
		setPicked(next)
		setTab('compose')
	}, [collectAllSignal, summary.charges])

	useEffect(() => {
		if (hasInvoices) setTab('invoice')
	}, [hasInvoices])

	useEffect(() => {
		if (!paymentAccountId && offlineAccounts[0])
			setPaymentAccountId(offlineAccounts[0].id)
	}, [offlineAccounts, paymentAccountId])

	const selectedInvoice = unpaid.find(
		(invoice) => invoice.id === selectedInvoiceId,
	)
	const invoiceMinor = convertCedisToPesewas(
		Number.parseFloat(invoiceAmount.replace(/,/g, '')) || 0,
	)
	const over = Boolean(
		selectedInvoice && invoiceMinor > remainingOn(selectedInvoice),
	)

	const composeTotal = Object.values(picked).reduce((sum, v) => sum + v, 0)
	const total = tab === 'invoice' ? invoiceMinor : composeTotal
	const canSubmit =
		!readonly && total > 0 && !over && !!paymentAccountId && !busy

	const record = async () => {
		setBusy(true)
		try {
			let invoiceId: string
			let amount: number

			if (tab === 'invoice') {
				if (!selectedInvoice) return
				invoiceId = selectedInvoice.id
				amount = invoiceMinor
			} else {
				// Composing bills the charges; it settles nothing. The payment
				// below is what moves outstanding_amount.
				const invoice = await compose.mutateAsync({
					client_id: clientId,
					property_id: propertyId,
					account_id: summary.account.id,
					data: {
						claims: Object.entries(picked).map(([id, value]) => ({
							charge_instance_id: id,
							amount: value,
						})),
						issue: true,
					},
				})
				invoiceId = invoice.id
				amount = composeTotal
			}

			await pay.mutateAsync({
				client_id: clientId,
				property_id: propertyId,
				invoice_id: invoiceId,
				data: {
					payment_account_id: paymentAccountId,
					amount,
					provider,
					reference: reference.trim() || undefined,
				},
			})

			toast.success(`Payment of ${money(amount)} recorded.`)
			setPicked({})
			setInvoiceAmount('')
			setReference('')
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
			})
			void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
		} catch (error) {
			const message = (error as Error).message
			toast.error(
				message === 'PaymentExceedsInvoiceBalance'
					? 'That is more than the invoice has left.'
					: message === 'ClaimExceedsChargeBalance'
						? 'One of those charges is already on an invoice. Refresh and try again.'
						: 'Could not record the payment. Please try again.',
			)
		} finally {
			setBusy(false)
		}
	}

	if (readonly) {
		return (
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full font-mono text-xs font-bold">
							4
						</span>
						Payments
					</CardTitle>
					<p className="text-muted-foreground mt-1 text-sm">
						This application is approved. Collection continues on the lease.
					</p>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<CheckCircle2 className="text-muted-foreground size-5" />
						<p className="text-sm">
							{money(summary.total_settled)} collected of{' '}
							{money(summary.total_charged)}
						</p>
						<Button variant="outline" size="sm" className="ml-auto">
							Open lease financials
							<ArrowRight className="size-4" />
						</Button>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full font-mono text-xs font-bold">
						4
					</span>
					Collect a payment
				</CardTitle>
				<p className="text-muted-foreground mt-1 text-sm">
					{hasInvoices ? (
						<>
							<span className="text-foreground font-semibold">
								{unpaid.length}{' '}
								{unpaid.length === 1 ? 'invoice is' : 'invoices are'} out.
							</span>{' '}
							Money usually arrives against an invoice that already exists —
							record it there. Those charges can't be put on a second invoice.
						</>
					) : (
						'Tick what the tenant is paying for, or type what they handed over and let it fill oldest first.'
					)}
				</p>
			</CardHeader>

			<CardContent className="space-y-5">
				{hasInvoices ? (
					<div className="bg-muted inline-flex gap-1 rounded-xl p-1">
						<Button
							variant={tab === 'invoice' ? 'default' : 'ghost'}
							size="sm"
							onClick={() => setTab('invoice')}
						>
							Against an invoice ({unpaid.length})
						</Button>
						<Button
							variant={tab === 'compose' ? 'default' : 'ghost'}
							size="sm"
							onClick={() => setTab('compose')}
						>
							Compose a new one
						</Button>
					</div>
				) : null}

				<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
					<div>
						{tab === 'invoice' && hasInvoices ? (
							<InvoiceTab
								invoices={unpaid}
								selectedId={selectedInvoiceId}
								onSelect={(invoice) => {
									setSelectedInvoiceId(invoice.id)
									setInvoiceAmount(
										String(convertPesewasToCedis(remainingOn(invoice))),
									)
								}}
								amount={invoiceAmount}
								setAmount={setInvoiceAmount}
								over={over}
								currency={currency}
							/>
						) : (
							<ChargePicker
								summary={summary}
								picked={picked}
								setPicked={setPicked}
							/>
						)}
					</div>

					<div className="bg-muted h-fit rounded-xl p-5">
						<p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
							Payment details
						</p>

						{offlineAccounts.length === 0 ? (
							<Alert className="mt-4">
								<Lock className="size-4" />
								<AlertDescription>
									No active offline payment account exists for this client. One
									is needed before a payment can be recorded.
								</AlertDescription>
							</Alert>
						) : (
							<div className="mt-4 space-y-4">
								<div>
									<Label>Received into</Label>
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
													{account.identifier || account.provider}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label>Method</Label>
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
									<Label htmlFor="payment-reference">
										Reference{' '}
										<span className="text-muted-foreground font-normal">
											optional
										</span>
									</Label>
									<Input
										id="payment-reference"
										className="mt-1.5 font-mono"
										placeholder="RCP-001"
										value={reference}
										onChange={(event) => setReference(event.target.value)}
									/>
								</div>
							</div>
						)}

						<div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-3 border-t pt-4">
							<span className="text-sm font-semibold">Total</span>
							<span
								className={`ml-auto text-2xl font-bold tracking-tight tabular-nums ${over ? 'text-destructive' : ''}`}
							>
								{money(total)}
							</span>
						</div>

						<Button
							className="mt-4 w-full"
							disabled={!canSubmit}
							onClick={() => void record()}
						>
							{busy ? <Spinner /> : null}
							Record payment
						</Button>

						<p className="text-muted-foreground mt-3 text-xs leading-relaxed">
							{tab === 'invoice'
								? "Settles the invoice's lines. No new invoice is created."
								: 'Creates the invoice and marks it paid in one step.'}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
