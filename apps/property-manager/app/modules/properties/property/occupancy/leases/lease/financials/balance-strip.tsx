import { nextIssue, overdueTotal } from './account'
import { Card, CardContent } from '~/components/ui/card'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { cn } from '~/lib/utils'

interface BalanceStripProps {
	summary: AccountSummary
	invoices: Invoice[]
}

const day = (date: Date) =>
	date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})

function Stat({
	label,
	value,
	sub,
	big,
	tone,
	subTone,
}: {
	label: string
	value: string
	sub: string
	big?: boolean
	tone?: string
	subTone?: string
}) {
	return (
		<div className="min-w-0">
			<p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
				{label}
			</p>
			<p
				className={cn(
					'mt-1.5 font-bold tracking-tight tabular-nums',
					big ? 'text-xl' : 'text-lg',
					tone,
				)}
			>
				{value}
			</p>
			<p className={cn('mt-1 text-xs', subTone ?? 'text-muted-foreground')}>
				{sub}
			</p>
		</div>
	)
}

/**
 * The four figures the tab exists to answer, and the two things you do about
 * them.
 *
 * Outstanding and Overdue are deliberately separate: outstanding is the whole
 * term including rent that isn't billed yet, overdue is only what the tenant is
 * actually late with.
 */
export function BalanceStrip({ summary, invoices }: BalanceStripProps) {
	const currency = summary.account.currency
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const overdue = overdueTotal(invoices)
	const late = invoices.filter(
		(i) => i.due_date && new Date(i.due_date) < new Date(),
	)
	const next = nextIssue(
		summary.charges,
		summary.account.auto_issue_days_before,
		summary.account.rent_billing_cadence,
	)

	return (
		<Card className="shadow-none">
			<CardContent className="space-y-5">
				<div className="grid grid-cols-2 gap-x-6 gap-y-5">
					<Stat
						label="Outstanding"
						value={money(summary.outstanding_amount)}
						sub="across the whole term"
						big
					/>
					<Stat
						label="Overdue now"
						value={money(overdue)}
						big
						tone={overdue > 0 ? 'text-danger' : 'text-muted-foreground'}
						subTone={overdue > 0 ? 'text-danger' : undefined}
						sub={
							overdue > 0
								? `${late.length} ${late.length === 1 ? 'invoice' : 'invoices'} past due`
								: 'nothing past its due date'
						}
					/>
					<Stat
						label="Collected to date"
						value={money(summary.total_settled)}
						tone="text-success"
						sub={`of ${money(summary.total_charged)} charged`}
					/>
					<Stat
						label="Next invoice"
						value={next ? day(next.issueOn) : '—'}
						sub={
							next
								? `${money(next.amount)} · ${next.charge.name}${next.extras ? ' + one-offs due' : ''}`
								: summary.account.rent_billing_cadence === 'MANUAL'
									? 'nothing is issued automatically'
									: 'nothing left to bill'
						}
					/>
				</div>

				{/* No actions here. Add charge lives on the Charges panel and
				    Record payment on the invoice it applies to — a second copy of
				    each only raises the question of whether they do the same thing. */}
				<p className="text-muted-foreground border-t pt-4 text-xs">
					Money is recorded against an invoice, so the outstanding figure only
					moves when a payment lands — not when one is issued.
				</p>
			</CardContent>
		</Card>
	)
}
