import { Check, FileText, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { isOverdue, remainingOn } from './account'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { TONE_CLASS, invoiceDisplayStatus } from '~/lib/display-status'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { paidSoFar } from '~/lib/invoice'
import { cn } from '~/lib/utils'

interface InvoicesPanelProps {
	invoices: Invoice[]
	currency: string
	propertyId: string
	onPay: (invoice: Invoice) => void
}

const day = (value: Date | string) =>
	new Date(value).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})

export function InvoicesPanel({
	invoices,
	currency,
	propertyId,
	onPay,
}: InvoicesPanelProps) {
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle className="col-start-1 text-lg">Invoices</CardTitle>
				<p className="text-muted-foreground col-start-1 mt-1 text-sm">
					Everything billed to the tenant so far. Payment is recorded against an
					invoice — a charge can only be invoiced once.
				</p>
			</CardHeader>

			<CardContent>
				{invoices.length === 0 ? (
					<p className="text-muted-foreground py-4 text-sm">
						Nothing has been billed yet. The collection plan issues the first
						invoice ahead of its due date.
					</p>
				) : null}

				{invoices.map((invoice, index) => {
					const balance = remainingOn(invoice)
					const status = invoiceDisplayStatus(invoice)
					const late = isOverdue(invoice)

					return (
						<div
							key={invoice.id}
							className={cn(
								'flex flex-wrap items-center gap-x-3.5 gap-y-2 py-1.5',
								index > 0 ? 'border-t' : '',
							)}
						>
							{/* The row opens the invoice; Record payment stays outside the
							    link, because a button nested in an anchor is neither valid
							    nor keyboard-navigable. */}
							<Link
								to={`/properties/${propertyId}/financials/invoices/${invoice.id}`}
								className="hover:bg-muted/50 -mx-2 flex min-w-0 flex-1 flex-wrap items-center gap-x-3.5 gap-y-2 rounded-lg px-2 py-2 transition-colors"
							>
								<span
									className={cn(
										'flex size-9 shrink-0 items-center justify-center rounded-xl',
										balance === 0
											? 'bg-success-bg text-success'
											: late
												? 'bg-danger-bg text-danger'
												: 'bg-info-bg text-info',
									)}
								>
									{balance === 0 ? (
										<Check className="size-4" />
									) : late ? (
										<TriangleAlert className="size-4" />
									) : (
										<FileText className="size-4" />
									)}
								</span>

								<div className="min-w-0 basis-[calc(100%-3.25rem)] sm:flex-1 sm:basis-0">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-mono text-sm font-bold">
											{invoice.code}
										</span>
										<Badge
											variant="outline"
											className={TONE_CLASS[status.tone]}
										>
											{status.label}
										</Badge>
									</div>
									<p className="text-muted-foreground mt-0.5 text-xs">
										{invoice.line_items?.length
											? invoice.line_items.map((line) => line.label).join(', ')
											: 'No lines'}
										{invoice.due_date
											? ` · due ${day(invoice.due_date)}`
											: null}
									</p>
								</div>

								<div className="ml-auto text-right sm:ml-0 sm:min-w-28">
									<p
										className={cn(
											'text-sm font-bold tabular-nums',
											balance ? '' : 'text-muted-foreground',
										)}
									>
										{money(balance || invoice.total_amount)}
									</p>
									<p className="text-muted-foreground mt-0.5 text-[11px]">
										{balance
											? 'outstanding'
											: invoice.paid_at
												? `paid ${day(invoice.paid_at)}`
												: 'settled in full'}
									</p>
								</div>
							</Link>

							{balance > 0 ? (
								<Button
									size="sm"
									className="max-sm:w-full"
									onClick={() => onPay(invoice)}
								>
									<Check className="size-4" />
									Record payment
								</Button>
							) : null}
						</div>
					)
				})}

				{invoices.some((i) => paidSoFar(i) > 0 && remainingOn(i) > 0) ? (
					<p className="text-muted-foreground mt-3 text-xs">
						A part-paid invoice settles its earliest line first — payment fills
						lines in due-date order.
					</p>
				) : null}
			</CardContent>
		</Card>
	)
}
