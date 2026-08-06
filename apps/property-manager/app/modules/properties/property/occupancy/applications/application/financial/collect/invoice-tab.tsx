import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { invoiceDisplayStatus } from '~/lib/display-status'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

export const paidSoFar = (invoice: Invoice) =>
	(invoice.payments ?? [])
		.filter((payment) => payment.status === 'SUCCESSFUL')
		.reduce((sum, payment) => sum + payment.amount, 0)

export const remainingOn = (invoice: Invoice) =>
	invoice.total_amount - paidSoFar(invoice)

interface InvoiceTabProps {
	invoices: Invoice[]
	selectedId: Nullable<string>
	onSelect: (invoice: Invoice) => void
	amount: string
	setAmount: (value: string) => void
	over: boolean
	currency: string
}

/**
 * Recording against an invoice that already exists.
 *
 * A charge can only be invoiced once, so anything already claimed cannot be put
 * on a second invoice — money for it has to land here instead. Payment fills
 * the invoice's lines oldest-due-first and may settle a line partially.
 */
export function InvoiceTab({
	invoices,
	selectedId,
	onSelect,
	amount,
	setAmount,
	over,
	currency,
}: InvoiceTabProps) {
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)
	const selected = invoices.find((invoice) => invoice.id === selectedId)
	const remaining = selected ? remainingOn(selected) : 0

	return (
		<div className="space-y-4">
			<div className="overflow-hidden rounded-xl border">
				{invoices.map((invoice, index) => {
					const on = invoice.id === selectedId
					const balance = remainingOn(invoice)
					const status = invoiceDisplayStatus(invoice)
					const paid = paidSoFar(invoice)

					return (
						<div
							key={invoice.id}
							className={`${index > 0 ? 'border-t' : ''} ${on ? 'bg-muted/40' : ''}`}
						>
							<button
								type="button"
								onClick={() => onSelect(invoice)}
								className="flex w-full items-center gap-3 p-4 text-left"
							>
								<span
									className={`flex size-4.5 shrink-0 items-center justify-center rounded-full border ${on ? 'border-foreground' : ''}`}
								>
									{on ? (
										<span className="bg-foreground size-2.5 rounded-full" />
									) : null}
								</span>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-mono text-sm font-bold">
											{invoice.code}
										</span>
										<Badge variant="outline">{status.label}</Badge>
									</div>
									<p className="text-muted-foreground mt-0.5 text-xs">
										{invoice.due_date
											? `Due ${new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
											: 'No due date'}
									</p>
								</div>
								<div className="min-w-32 text-right">
									<p className="text-sm font-semibold tabular-nums">
										{money(balance)}
									</p>
									{paid > 0 ? (
										<p className="text-muted-foreground mt-0.5 text-xs">
											{money(paid)} of {money(invoice.total_amount)} paid
										</p>
									) : null}
								</div>
							</button>

							{on ? (
								<div className="space-y-3 px-4 pb-4 pl-12">
									{(invoice.line_items ?? []).map((line) => (
										<div
											key={line.id}
											className="flex items-center gap-3 border-t pt-3 text-sm"
										>
											<span className="text-muted-foreground flex-1 truncate">
												{line.label}
											</span>
											<span className="min-w-24 text-right font-semibold tabular-nums">
												{money(line.total_amount)}
											</span>
										</div>
									))}

									<div className="flex flex-wrap items-center gap-3 pt-1">
										<span className="text-sm font-medium">Amount received</span>
										<div className="flex items-center gap-2">
											<span className="text-muted-foreground text-sm font-semibold">
												GH₵
											</span>
											<Input
												inputMode="decimal"
												className={`w-36 ${over ? 'border-destructive' : ''}`}
												value={amount}
												onChange={(event) => setAmount(event.target.value)}
											/>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setAmount(String(convertPesewasToCedis(balance)))
											}
										>
											Pay the balance · {money(balance)}
										</Button>
									</div>
									<p className="text-muted-foreground text-xs">
										Less than the balance leaves the invoice part paid — the
										lines settle oldest first.
									</p>
								</div>
							) : null}
						</div>
					)
				})}
			</div>

			{over && selected ? (
				<Alert variant="destructive">
					<AlertTriangle className="size-4" />
					<AlertTitle>That is more than the invoice has left</AlertTitle>
					<AlertDescription className="flex flex-col items-start gap-2">
						<span>
							{selected.code} has {money(remaining)} outstanding. Reduce the
							amount, or compose a second invoice for the rest.
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setAmount(String(convertPesewasToCedis(remaining)))}
						>
							Use {money(remaining)}
						</Button>
					</AlertDescription>
				</Alert>
			) : null}
		</div>
	)
}
