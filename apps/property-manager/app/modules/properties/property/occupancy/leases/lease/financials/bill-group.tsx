import { Check, FileText, TriangleAlert } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import type { BillGroup, BillStatus } from '~/lib/lease-money'
import { cn } from '~/lib/utils'

const day = (value: Date | string) =>
	new Date(value).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC',
	})

const TONE: Record<BillStatus['kind'], string> = {
	paid: 'bg-success-bg text-success',
	late: 'bg-warning-bg text-warning',
	today: 'bg-warning-bg text-warning',
	open: 'bg-info-bg text-info',
}

/**
 * A bill, and the things that went out in it.
 *
 * The bill is the grouping, not the unit: a tenant pays a bill, but what they
 * owe is the items inside it. Showing both as separate lists made the same
 * money appear twice, so the items live here, indented, and appear nowhere
 * else on the page.
 */
export function BillGroupCard({
	group,
	currency,
	tenantName,
	readonly,
	onPay,
}: {
	group: BillGroup
	currency: string
	tenantName: string
	readonly: boolean
	onPay?: (invoice: Invoice) => void
}) {
	const amount = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)
	const { invoice, lines, balance, status, total } = group
	const late = status.kind === 'late'
	const Glyph = status.kind === 'paid' ? Check : late ? TriangleAlert : FileText

	const line = ((): string => {
		if (status.kind === 'paid')
			return invoice.paid_at
				? `${tenantName} paid it on ${day(invoice.paid_at)}`
				: 'Paid in full'
		if (late)
			return `Was due ${day(invoice.due_date!)} — ${amount(balance)} still owed`
		if (status.kind === 'today') return `${amount(balance)} due today`
		return invoice.due_date
			? `${amount(balance)} due ${day(invoice.due_date)}`
			: amount(balance)
	})()

	return (
		<div
			className={cn('rounded-xl border p-4', late ? 'border-warning/40' : '')}
			data-bill={invoice.id}
		>
			<div className="flex flex-wrap items-center gap-3">
				<span
					className={cn(
						'flex size-9 shrink-0 items-center justify-center rounded-lg',
						TONE[status.kind],
					)}
				>
					<Glyph className="size-4" />
				</span>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-bold">
							Bill sent {day(invoice.issued_at ?? invoice.created_at)}
						</span>
						<Badge variant="secondary" className={TONE[status.kind]}>
							{status.label}
						</Badge>
					</div>
					<p
						className={cn(
							'mt-1 text-sm',
							late ? 'text-warning' : 'text-muted-foreground',
						)}
					>
						{line}
					</p>
				</div>

				{balance > 0 && !readonly && onPay ? (
					<Button
						variant={late ? 'default' : 'outline'}
						size="sm"
						onClick={() => onPay(invoice)}
					>
						<Check className="size-3.5" />
						Record a payment
					</Button>
				) : null}

				<span className="min-w-24 text-right font-bold whitespace-nowrap">
					{amount(total)}
				</span>
			</div>

			{lines.length > 0 ? (
				<div className="mt-3 border-t pt-1 pl-12">
					{lines.map((charge, index) => {
						const paid = charge.settled_amount >= charge.amount
						const overdue = !paid && new Date(charge.due_date) < new Date()
						return (
							<div
								key={charge.id}
								data-charge={charge.id}
								className={cn(
									'flex items-center gap-3 py-2',
									index === 0 ? '' : 'border-t',
								)}
							>
								<span className="min-w-0 flex-1 truncate text-sm">
									{charge.name}
								</span>
								<span
									className={cn(
										'text-xs',
										paid
											? 'text-success'
											: overdue
												? 'text-warning'
												: 'text-muted-foreground',
									)}
								>
									{paid
										? 'paid'
										: overdue
											? `overdue since ${day(charge.due_date)}`
											: `due ${day(charge.due_date)}`}
								</span>
								<span className="min-w-24 text-right text-sm font-semibold whitespace-nowrap">
									{amount(charge.amount)}
								</span>
							</div>
						)
					})}
				</div>
			) : null}
		</div>
	)
}
