import { Check } from 'lucide-react'
import { RecordPaymentButton } from './record-payment-button'
import { fmtDate, successfulPayments } from './state'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { paidSoFar, remainingOn } from '~/lib/invoice'
import { getPaymentStatusLabel } from '~/lib/payment.utils'

interface Props {
	invoice: Invoice
	propertyId?: string
}

export function InvoicePaymentsSection({ invoice, propertyId }: Props) {
	const money = (pesewas: number) =>
		formatAmount(convertPesewasToCedis(pesewas), invoice.currency)
	const settled = successfulPayments(invoice)
	const pending = (invoice.payments ?? []).filter(
		(payment) => payment.status !== 'SUCCESSFUL',
	)
	const owed = remainingOn(invoice)

	return (
		<Card className="shadow-none print:hidden">
			<CardContent className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-foreground text-lg font-semibold tracking-tight">
						What has been paid
					</h2>
					{propertyId && owed > 0 && invoice.status !== 'VOID' && (
						<RecordPaymentButton
							invoice={invoice}
							propertyId={propertyId}
							variant="outline"
						>
							<Check />
							They paid — record it
						</RecordPaymentButton>
					)}
				</div>

				{settled.length === 0 ? (
					<p className="text-muted-foreground text-sm leading-relaxed">
						Nothing yet. When the money comes in, record it and this bill will
						show what is left.
					</p>
				) : (
					<>
						<p className="text-muted-foreground text-sm leading-relaxed">
							{settled.length === 1
								? 'One payment'
								: `${settled.length} payments`}{' '}
							against this bill, {money(paidSoFar(invoice))} in all
							{owed > 0 ? ` — ${money(owed)} to go.` : '. That settles it.'}
						</p>
						<div className="divide-y rounded-lg border">
							{settled.map((payment) => (
								<div
									key={payment.id}
									className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3.5"
								>
									<div className="bg-muted text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
										<Check className="size-4" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-foreground text-sm font-medium">
											{fmtDate(payment.successful_at ?? payment.created_at)}
										</p>
										<p className="text-muted-foreground text-xs">
											{payment.provider || payment.rail || 'Recorded'}
											{payment.reference ? ` · ${payment.reference}` : ''}
										</p>
									</div>
									<span className="text-foreground text-sm font-semibold tabular-nums">
										{money(payment.amount)}
									</span>
								</div>
							))}
						</div>
					</>
				)}

				{pending.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{pending.map((payment) => (
							<Badge key={payment.id} variant="outline" className="gap-1.5">
								{getPaymentStatusLabel(payment.status)} ·{' '}
								{money(payment.amount)}
							</Badge>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
