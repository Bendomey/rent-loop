import dayjs from 'dayjs'

import { formatAmount } from '~/lib/format-amount'
import { cn } from '~/lib/utils'

interface Props {
	invoice: TrackingInvoice | null
}

const STATUS_STYLES: Record<string, string> = {
	DRAFT: 'bg-slate-100 text-slate-600',
	ISSUED: 'bg-blue-100 text-blue-700',
	PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700',
	PAID: 'bg-green-100 text-green-700',
	VOID: 'bg-red-100 text-red-700',
}

export function PaymentInfo({ invoice }: Props) {
	if (!invoice) {
		return (
			<div className="rounded-lg border bg-white p-6">
				<h3 className="text-sm font-semibold text-slate-900">Payment</h3>
				<p className="mt-3 text-sm text-slate-400">
					No payment information yet
				</p>
			</div>
		)
	}

	return (
		<div className="rounded-lg border bg-white p-6">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-slate-900">Payment</h3>
				<span
					className={cn(
						'rounded-full px-2.5 py-0.5 text-xs font-medium',
						STATUS_STYLES[invoice.status] ?? STATUS_STYLES.DRAFT,
					)}
				>
					{invoice.status.replace('_', ' ')}
				</span>
			</div>

			<div className="mt-3 space-y-1 text-sm text-slate-500">
				<p>
					Invoice:{' '}
					<span className="font-medium text-slate-700">{invoice.code}</span>
				</p>
				{invoice.due_date && (
					<p>
						Due:{' '}
						<span className="text-slate-700">
							{dayjs(invoice.due_date).format('MMM D, YYYY')}
						</span>
					</p>
				)}
				{invoice.paid_at && (
					<p>
						Paid:{' '}
						<span className="text-green-600">
							{dayjs(invoice.paid_at).format('MMM D, YYYY')}
						</span>
					</p>
				)}
			</div>

			{/* Line items */}
			{invoice.line_items.length > 0 && (
				<div className="mt-4">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b text-left text-xs text-slate-400">
								<th className="pb-2 font-medium">Item</th>
								<th className="pb-2 text-right font-medium">Amount</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{invoice.line_items.map((item, idx) => (
								<tr key={idx}>
									<td className="py-2 text-slate-600">{item.label}</td>
									<td className="py-2 text-right text-slate-700">
										{formatAmount(item.total_amount)}
									</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr className="border-t">
								<td className="pt-2 font-semibold text-slate-900">Total</td>
								<td className="pt-2 text-right font-semibold text-slate-900">
									{formatAmount(invoice.total_amount)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			)}
		</div>
	)
}
