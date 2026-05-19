import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { TypographyH1 } from '~/components/ui/typography'
import { getBookingDuration, getBookingRateLabel } from '~/lib/booking.utils'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

const INVOICE_STATUS_CONFIG: Record<
	string,
	{ label: string; className: string }
> = {
	DRAFT: {
		label: 'Draft',
		className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
	},
	ISSUED: {
		label: 'Unpaid',
		className:
			'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
	},
	PARTIALLY_PAID: {
		label: 'Partial',
		className:
			'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
	},
	PAID: {
		label: 'Paid',
		className:
			'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
	},
	VOID: {
		label: 'Void',
		className: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
	},
}

function LineItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-muted-foreground text-xs">{label}</span>
			<span className="text-xs font-medium">{value}</span>
		</div>
	)
}

export function PaymentCard({ booking }: { booking: Booking }) {
	const { count, label: periodLabel } = getBookingDuration(
		booking.check_in_date,
		booking.check_out_date,
		booking.stay_frequency,
	)
	const rateLabel = getBookingRateLabel(booking.stay_frequency)
	const totalCedis = convertPesewasToCedis(booking.rate)
	const periodRate = count > 0 ? totalCedis / count : totalCedis

	const invoice = booking.invoice
	const statusCfg = invoice
		? INVOICE_STATUS_CONFIG[invoice.status]
		: INVOICE_STATUS_CONFIG['ISSUED']

	const invoiceTotal = invoice
		? convertPesewasToCedis(invoice.total_amount)
		: totalCedis
	const invoiceTaxes = invoice ? convertPesewasToCedis(invoice.taxes) : 0

	return (
		<Card className="shadow-none">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-[10px] font-semibold tracking-widest text-rose-600 uppercase">
						Payment
					</CardTitle>
					<Badge
						variant="outline"
						className={`text-[10px] tracking-wide uppercase ${statusCfg?.className}`}
					>
						{statusCfg?.label}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<p className="text-muted-foreground text-xs font-light">
						Booking total
					</p>
					<TypographyH1 className="text-2xl font-light">
						{formatAmount(invoiceTotal, booking.currency)}
					</TypographyH1>
				</div>

				<Separator />

				<div className="space-y-2">
					<LineItem
						label={`${rateLabel} × ${count} ${periodLabel}`}
						value={formatAmount(periodRate * count, booking.currency)}
					/>
					{invoiceTaxes > 0 ? (
						<LineItem
							label="Taxes"
							value={formatAmount(invoiceTaxes, booking.currency)}
						/>
					) : null}
					<Separator />
					<div className="flex items-center justify-between gap-4">
						<span className="text-xs font-semibold">Total due</span>
						<span className="text-xs font-bold">
							{formatAmount(invoiceTotal, booking.currency)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
