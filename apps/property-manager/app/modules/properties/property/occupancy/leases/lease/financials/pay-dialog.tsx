import { useQueryClient } from '@tanstack/react-query'
import { Check, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { remainingOn } from './account'
import { usePayInvoice } from '~/api/financial-accounts'
import { useGetPaymentAccounts } from '~/api/payment-accounts'
import { PAYMENT_PROVIDERS } from '~/components/blocks/financials/payment-providers'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import { TONE_CLASS } from '~/lib/display-status'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
	formatAmount,
} from '~/lib/format-amount'

interface PayDialogProps {
	invoice: Nullable<Invoice>
	clientId: string
	propertyId: string
	currency: string
	onClose: () => void
}

const day = (value: Date | string) =>
	new Date(value).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})

/**
 * Payment is always recorded against an invoice — the same rule as the
 * application. The footer states what the entered amount will do before it is
 * committed: settle in full, leave a balance, or be refused.
 */
export function PayDialog({
	invoice,
	clientId,
	propertyId,
	currency,
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
		filters: { rail: 'OFFLINE', status: 'ACTIVE' },
	})
	const offlineAccounts = (accountPage?.rows ?? []).filter(
		(account) => account.rail === 'OFFLINE' && account.status === 'ACTIVE',
	)

	// Opening on a different invoice re-arms the form with that balance.
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
							? 'That is more than the invoice has left.'
							: 'Could not record the payment. Please try again.',
					),
			},
		)
	}

	return (
		<Dialog open={Boolean(invoice)} onOpenChange={(next) => !next && onClose()}>
			<DialogContent className="flex max-h-[85svh] flex-col sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Record a payment</DialogTitle>
					<DialogDescription>
						{invoice ? (
							<>
								Against{' '}
								<span className="text-foreground font-mono font-semibold">
									{invoice.code}
								</span>
								{invoice.due_date ? `, due ${day(invoice.due_date)}` : null}.
							</>
						) : null}
					</DialogDescription>
				</DialogHeader>

				{invoice ? (
					<div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
						<div className="rounded-xl border px-4">
							{(invoice.line_items ?? []).map((line, index) => (
								<div
									key={line.id}
									className={`flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 ${index > 0 ? 'border-t' : ''}`}
								>
									<span className="min-w-0 flex-1 truncate text-sm">
										{line.label}
									</span>
									<Badge variant="outline" className={TONE_CLASS.info}>
										Unpaid
									</Badge>
									<span className="ml-auto text-sm font-bold tabular-nums">
										{money(line.total_amount)}
									</span>
								</div>
							))}
						</div>

						<div className="flex flex-wrap items-end gap-3">
							<div>
								<Label htmlFor="pay-amount">Amount received</Label>
								<div className="mt-1.5 flex items-center gap-2">
									<span className="text-muted-foreground text-sm font-semibold">
										GH₵
									</span>
									<Input
										id="pay-amount"
										inputMode="decimal"
										className="w-40 font-semibold"
										value={amount}
										onChange={(event) => setAmount(event.target.value)}
									/>
								</div>
							</div>
							{/* Only when the amount falls short — see the application's copy
							    of this control. */}
							{entered < balance ? (
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setAmount(String(convertPesewasToCedis(balance)))
									}
								>
									<Check className="size-4" />
									Pay the balance · {money(balance)}
								</Button>
							) : null}
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
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
								<Label htmlFor="pay-reference">
									Reference{' '}
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

						{over ? (
							<Alert variant="destructive">
								<TriangleAlert className="size-4" />
								<AlertTitle>More than this invoice has left</AlertTitle>
								<AlertDescription className="flex flex-col items-start gap-3">
									<span>
										{invoice.code} has {money(balance)} outstanding. Reduce the
										amount, or record the rest against another invoice.
									</span>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setAmount(String(convertPesewasToCedis(balance)))
										}
									>
										Use {money(balance)}
									</Button>
								</AlertDescription>
							</Alert>
						) : null}
					</div>
				) : null}

				<DialogFooter className="shrink-0 border-t pt-4 sm:items-center sm:justify-between">
					{/* Says what the amount will do before it is committed. */}
					<p
						className={`min-w-0 flex-1 text-xs ${over ? 'text-destructive' : 'text-muted-foreground'}`}
					>
						{over
							? `That is ${money(entered - balance)} more than this invoice has left.`
							: short
								? `Leaves ${money(balance - entered)} outstanding — the invoice stays part paid.`
								: 'Settles the invoice in full.'}
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
							Record {money(entered)}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
