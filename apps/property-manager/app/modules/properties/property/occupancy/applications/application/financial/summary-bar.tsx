import { Card, CardContent } from '~/components/ui/card'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface SummaryBarProps {
	summary: AccountSummary
	readonly?: boolean
}

function Stat({
	label,
	value,
	sub,
	emphasis,
}: {
	label: string
	value: string
	sub?: string
	emphasis?: boolean
}) {
	return (
		<div className="min-w-0">
			<p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
				{label}
			</p>
			<p
				className={
					emphasis
						? 'text-primary mt-1.5 text-xl font-bold tracking-tight tabular-nums'
						: 'mt-1.5 text-lg font-bold tracking-tight tabular-nums'
				}
			>
				{value}
			</p>
			{sub ? <p className="text-muted-foreground mt-1 text-xs">{sub}</p> : null}
		</div>
	)
}

/**
 * The account's headline figures.
 *
 * available_credit is deliberately not shown: overpayment is refused by the
 * API, so it is structurally always zero and a field that can only ever read
 * GH₵ 0.00 is noise.
 */
export function SummaryBar({ summary, readonly }: SummaryBarProps) {
	const currency = summary.account.currency
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const chargeCount = summary.charges.filter((c) => !c.voided_at).length

	return (
		<Card className="shadow-none">
			<CardContent className="grid grid-cols-2 gap-x-6 gap-y-5 2xl:grid-cols-4">
				<div className="min-w-0">
					<p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
						Financial account
					</p>
					<p className="mt-1.5 font-mono text-sm font-bold">
						{summary.account.code}
					</p>
					<p className="text-muted-foreground mt-1 text-xs">
						{chargeCount} {chargeCount === 1 ? 'charge' : 'charges'}
					</p>
				</div>

				<Stat label="Charged" value={money(summary.total_charged)} />
				<Stat label="Settled" value={money(summary.total_settled)} />

				<Stat
					label="Outstanding"
					value={money(summary.outstanding_amount)}
					emphasis
					// The rule people get wrong: composing an invoice claims a charge
					// but settles nothing. Only a payment moves this number.
					sub={
						readonly
							? 'Carried onto the lease'
							: 'Only a payment moves this — invoicing does not'
					}
				/>
			</CardContent>
		</Card>
	)
}
