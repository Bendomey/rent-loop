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
	green: 'border-emerald-600/40 text-emerald-700',
	crimson: 'border-rose-600/40 text-rose-700',
	amber: 'border-amber-600/40 text-amber-700',
	zinc: 'border-zinc-400 text-zinc-600',
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
		<div className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
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
		<div className="print-sheet relative overflow-hidden rounded-sm border border-zinc-200 bg-white text-zinc-900 shadow-sm">
			<div className="absolute inset-x-0 top-0 h-1 bg-rose-600" />
			<div className="p-7 sm:p-12">
				<div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-zinc-900 pb-6">
					<div>
						<div className="text-2xl font-semibold tracking-tight">
							rent<span className="text-rose-600">loop</span>
						</div>
						<div className="mt-3 text-sm leading-relaxed text-zinc-600">
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
						<div className="text-3xl font-semibold tracking-tight">Bill</div>
						<div className="mt-1 font-mono text-sm text-zinc-500">
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

				<div className="grid gap-6 border-b border-zinc-200 py-6 sm:grid-cols-3">
					<div>
						<Label>Billed to</Label>
						<div className="mt-2 font-medium">{payerName ?? '—'}</div>
						<div className="mt-1 text-sm leading-relaxed text-zinc-500">
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
							<div className="mt-1 text-sm text-zinc-500">
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
								<span className="text-zinc-500">Issued</span>
								<span className="font-medium">
									{invoice.issued_at
										? fmtDate(invoice.issued_at)
										: 'Not issued'}
								</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-zinc-500">Due</span>
								<span
									className={cn(
										'font-semibold',
										(state.key === 'late' || state.key === 'part') &&
											'text-rose-700',
									)}
								>
									{invoice.due_date ? fmtDate(invoice.due_date) : '—'}
								</span>
							</div>
						</div>
					</div>
				</div>

				<table className="mt-6 w-full text-sm">
					<thead>
						<tr className="border-b border-zinc-900 text-xs tracking-widest text-zinc-500 uppercase">
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
								className="border-b border-zinc-200 align-baseline"
							>
								<td className="py-3 pr-3">
									<div className="font-medium">{item.label}</div>
									<div className="text-xs text-zinc-500">{item.category}</div>
								</td>
								<td className="px-3 py-3 text-right text-zinc-600 tabular-nums">
									{money(item.unit_amount)}
								</td>
								<td className="px-3 py-3 text-right text-zinc-600 tabular-nums">
									{item.quantity}
								</td>
								<td className="py-3 pl-3 text-right font-medium tabular-nums">
									{money(item.total_amount)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				<div className="mt-3 text-xs text-zinc-500">
					{invoice.line_items?.length ?? 0}{' '}
					{invoice.line_items?.length === 1 ? 'item' : 'items'} on this bill
					{rentCount > 1 ? `, ${rentCount} of them rent` : ''}. That is
					everything.
				</div>

				<div className="mt-6 flex justify-end">
					<div className="w-full max-w-xs text-sm">
						<div className="flex justify-between py-1 text-zinc-600">
							<span>Subtotal</span>
							<span className="tabular-nums">{money(invoice.sub_total)}</span>
						</div>
						<div className="flex justify-between py-1 text-zinc-600">
							<span>Tax</span>
							<span className="tabular-nums">{money(invoice.taxes)}</span>
						</div>
						<div className="flex justify-between border-t border-zinc-900 py-2 font-bold">
							<span>The whole bill</span>
							<span className="tabular-nums">
								{money(invoice.total_amount)}
							</span>
						</div>
						{paid > 0 && (
							<div className="flex justify-between border-t border-zinc-200 py-2 text-zinc-600">
								<span>Paid so far</span>
								<span className="text-emerald-700 tabular-nums">
									− {money(paid)}
								</span>
							</div>
						)}
						<div
							className={cn(
								'mt-3 flex items-center justify-between rounded-lg border px-4 py-3',
								owed > 0
									? 'border-rose-600/30 bg-rose-50'
									: 'border-emerald-600/30 bg-emerald-50',
							)}
						>
							<span
								className={cn(
									'text-xs font-bold tracking-widest uppercase',
									owed > 0 ? 'text-rose-700' : 'text-emerald-700',
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

				<div className="mt-8 grid gap-6 border-t border-zinc-200 pt-6 text-sm sm:grid-cols-2">
					<div>
						<Label>How they may pay</Label>
						<div className="mt-2 flex flex-wrap gap-2">
							{invoice.allowed_payment_rails?.length ? (
								invoice.allowed_payment_rails.map((rail) => (
									<span
										key={rail}
										className="rounded border border-zinc-200 px-3 py-1 font-medium"
									>
										{getInvoiceAllowedRailsLabel(rail)}
									</span>
								))
							) : (
								<span className="text-zinc-500">Not set</span>
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
						<p className="mt-2 leading-relaxed text-zinc-600">{terms}</p>
					</div>
				</div>

				<div className="mt-8 hidden text-xs text-zinc-400 print:block">
					Generated from Rentloop on {fmtDate(new Date())}
				</div>
			</div>
		</div>
	)
}
