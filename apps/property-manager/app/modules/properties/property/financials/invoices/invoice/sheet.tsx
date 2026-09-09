import type { ReactNode } from 'react'
import { type InvoiceState, fmtDate } from './state'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import {
	getInvoiceAllowedRailsLabel,
	paidSoFar,
	remainingOn,
} from '~/lib/invoice'
import { cn } from '~/lib/utils'

const toneClass: Record<InvoiceState['tone'], string> = {
	green: 'border-emerald-500/40 text-emerald-600',
	crimson: 'border-rose-500/40 text-rose-600',
	amber: 'border-amber-500/40 text-amber-600',
	zinc: 'border-border text-muted-foreground',
}

interface Props {
	invoice: Invoice
	state: InvoiceState
	kind: string
	propertyName?: string
	unitLabel?: string
	payerName?: string
	payerMeta?: string
	payerPhone?: string
	leaseCode?: string
}

function Label({ children }: { children: ReactNode }) {
	return (
		<div className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
			{children}
		</div>
	)
}

export function InvoiceSheet({
	invoice,
	state,
	kind,
	propertyName,
	unitLabel,
	payerName,
	payerMeta,
	payerPhone,
	leaseCode,
}: Props) {
	const money = (pesewas: number) =>
		formatAmount(convertPesewasToCedis(pesewas), invoice.currency)
	const paid = paidSoFar(invoice)
	const owed = remainingOn(invoice)
	const rentCount =
		invoice.line_items?.filter((item) => item.category === 'RENT').length ?? 0

	const terms =
		state.key === 'paid'
			? 'This bill is settled and closed. It stays here as the record of what was paid — nothing further is added to it.'
			: state.key === 'draft'
				? 'It has not been sent. Issue it and the amount becomes owed against the agreement.'
				: state.key === 'void'
					? state.detail
					: state.key === 'late'
						? `It has counted as late since ${fmtDate(localizedDayjs(invoice.due_date!).add(1, 'day').toDate())}. Nothing has been added on top — no late fee sits on this bill.`
						: `This amount already shows as owed against the agreement. What changes after ${invoice.due_date ? fmtDate(invoice.due_date) : 'the due date'} is that it counts as late. Nothing is added on top.`

	return (
		<div className="print-sheet bg-card text-card-foreground border-border relative overflow-hidden rounded-sm border shadow-sm print:overflow-visible">
			<div className="absolute inset-x-0 top-0 h-1 bg-rose-600" />
			<div className="p-7 sm:p-12">
				<div className="border-foreground/70 flex flex-wrap items-start justify-between gap-6 border-b-2 pb-6">
					<div>
						<div className="text-2xl font-semibold tracking-tight">
							rent<span className="text-rose-600">loop</span>
						</div>
						<div className="text-muted-foreground mt-3 text-sm leading-relaxed">
							{propertyName ?? 'Property'}
							{unitLabel && (
								<>
									<br />
									{unitLabel}
								</>
							)}
						</div>
					</div>
					<div className="text-right">
						<div className="text-2xl font-semibold tracking-tight">Bill</div>
						<div className="text-muted-foreground mt-1 font-mono text-sm">
							{invoice.code}
						</div>
						<div
							className={cn(
								'mt-3 inline-block rounded border-2 px-3 py-1 text-xs font-bold tracking-widest uppercase',
								toneClass[state.tone],
							)}
						>
							{state.stamp}
						</div>
					</div>
				</div>

				<div className="border-border grid gap-6 border-b py-6 sm:grid-cols-3">
					<div>
						<Label>Billed to</Label>
						<div className="mt-2 font-medium">{payerName ?? '—'}</div>
						<div className="text-muted-foreground mt-1 text-sm leading-relaxed">
							{payerMeta}
							{payerPhone && (
								<>
									<br />
									{payerPhone}
								</>
							)}
						</div>
					</div>
					<div>
						<Label>What it is for</Label>
						<div className="mt-2 font-medium">{kind}</div>
						{leaseCode && (
							<div className="text-muted-foreground mt-1 text-sm">
								Agreement {leaseCode}
								{rentCount > 0 &&
									` · ${rentCount === 1 ? '1 month of rent' : `${rentCount} months of rent`}`}
							</div>
						)}
					</div>
					<div>
						<Label>Dates</Label>
						<div className="mt-2 space-y-1.5 text-sm">
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">Issued</span>
								<span className="font-medium">
									{invoice.issued_at
										? fmtDate(invoice.issued_at)
										: 'Not issued'}
								</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-muted-foreground">Due</span>
								<span
									className={cn(
										'font-semibold',
										(state.key === 'late' || state.key === 'part') &&
											'text-rose-600',
									)}
								>
									{invoice.due_date ? fmtDate(invoice.due_date) : '—'}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6 overflow-x-auto print:overflow-visible">
					<table className="w-full min-w-[32rem] text-sm print:min-w-0">
						<thead>
							<tr className="border-foreground/70 text-muted-foreground border-b text-xs tracking-widest uppercase">
								<th className="py-2 pr-3 text-left font-bold">Item</th>
								<th className="px-3 py-2 text-right font-bold">Each</th>
								<th className="px-3 py-2 text-right font-bold">Qty</th>
								<th className="py-2 pl-3 text-right font-bold">Amount</th>
							</tr>
						</thead>
						<tbody>
							{invoice.line_items?.map((item) => (
								<tr
									key={item.id}
									className="border-border border-b align-baseline"
								>
									<td className="py-3 pr-3">
										<div className="font-medium">{item.label}</div>
										<div className="text-muted-foreground text-xs">
											{item.category}
										</div>
									</td>
									<td className="text-muted-foreground px-3 py-3 text-right tabular-nums">
										{money(item.unit_amount)}
									</td>
									<td className="text-muted-foreground px-3 py-3 text-right tabular-nums">
										{item.quantity}
									</td>
									<td className="py-3 pl-3 text-right font-medium tabular-nums">
										{money(item.total_amount)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="text-muted-foreground mt-3 text-xs">
					{invoice.line_items?.length ?? 0}{' '}
					{invoice.line_items?.length === 1 ? 'item' : 'items'} on this bill
					{rentCount > 1 ? `, ${rentCount} of them rent` : ''}. That is
					everything.
				</div>

				<div className="mt-6 flex justify-end">
					<div className="w-full max-w-xs text-sm">
						<div className="text-muted-foreground flex justify-between py-1">
							<span>Subtotal</span>
							<span className="tabular-nums">{money(invoice.sub_total)}</span>
						</div>
						<div className="text-muted-foreground flex justify-between py-1">
							<span>Tax</span>
							<span className="tabular-nums">{money(invoice.taxes)}</span>
						</div>
						<div className="border-foreground/70 flex justify-between border-t py-2 font-bold">
							<span>The whole bill</span>
							<span className="tabular-nums">
								{money(invoice.total_amount)}
							</span>
						</div>
						{paid > 0 && (
							<div className="border-border text-muted-foreground flex justify-between border-t py-2">
								<span>Paid so far</span>
								<span className="text-emerald-600 tabular-nums">
									− {money(paid)}
								</span>
							</div>
						)}
						<div
							className={cn(
								'mt-3 flex items-center justify-between rounded-lg border px-4 py-3',
								owed > 0
									? 'border-rose-500/30 bg-rose-500/10'
									: 'border-emerald-500/30 bg-emerald-500/10',
							)}
						>
							<span
								className={cn(
									'text-xs font-bold tracking-widest uppercase',
									owed > 0 ? 'text-rose-600' : 'text-emerald-600',
								)}
							>
								{owed > 0 ? 'Still owed' : 'Nothing owed'}
							</span>
							<span className="text-lg font-semibold tabular-nums">
								{money(owed)}
							</span>
						</div>
					</div>
				</div>

				<div className="border-border mt-8 grid gap-6 border-t pt-6 text-sm sm:grid-cols-2">
					<div>
						<Label>How they may pay</Label>
						<div className="mt-2 flex flex-wrap gap-2">
							{invoice.allowed_payment_rails?.length ? (
								invoice.allowed_payment_rails.map((rail) => (
									<span
										key={rail}
										className="border-border rounded border px-3 py-1 font-medium"
									>
										{getInvoiceAllowedRailsLabel(rail)}
									</span>
								))
							) : (
								<span className="text-muted-foreground">Not set</span>
							)}
						</div>
					</div>
					<div>
						<Label>
							{state.key === 'paid'
								? 'Nothing more to do'
								: state.key === 'late'
									? 'It is late'
									: 'After the due date'}
						</Label>
						<p className="text-muted-foreground mt-2 leading-relaxed">
							{terms}
						</p>
					</div>
				</div>

				<div className="text-muted-foreground mt-8 hidden text-xs print:block">
					Generated from Rentloop on {fmtDate(new Date())}
				</div>
			</div>
		</div>
	)
}
