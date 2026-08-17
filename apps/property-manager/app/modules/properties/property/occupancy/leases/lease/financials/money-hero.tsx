import { Check, Plus } from 'lucide-react'
import { type NextIssue } from './account'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { billLabel, type LeaseMoney } from '~/lib/lease-money'
import { cn } from '~/lib/utils'

const day = (value: Date | string) =>
	new Date(value).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC',
	})

/**
 * How the tenancy is doing with money, in three figures and one sentence.
 *
 * The detailed version answered an accountant's question — charged, settled,
 * outstanding, invoice count. This answers the landlord's: are we behind, by
 * how much, and what happens next.
 */
export function MoneyHero({
	money,
	nextIssue,
	currency,
	tenantName,
	readonly,
	onPay,
	onAddFee,
}: {
	money: LeaseMoney
	/** Null when nothing is scheduled — a manual account issues nothing. */
	nextIssue: Nullable<NextIssue>
	currency: string
	tenantName: string
	readonly: boolean
	onPay: () => void
	onAddFee: () => void
}) {
	const amount = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)
	const late = money.lateTotal > 0
	/** Whether there is anything unbilled left for a payment to go against. */
	const canCollect = money.comingFees.length > 0 || money.comingRent.length > 0

	/*
	 * What is late, not when its bill went out. "Bill sent 3 Nov — 7 days late"
	 * makes the landlord go and look up which bill that was; "November 2026
	 * rent — 7 days late" is the same sentence with the answer already in it.
	 *
	 * A bill is named first because that is what the tenant was actually asked
	 * for. Falling back to the charge covers money that is overdue with nothing
	 * sent for it — real on a manual plan, and invisible if only bills counted.
	 */
	const lateLine = money.lateBills[0]
		? `${billLabel(money.lateBills[0])} — ${money.lateBills[0].status.label.toLowerCase()}`
		: money.lateCharges[0]
			? `${money.lateCharges[0].name} — was due ${day(money.lateCharges[0].due_date)}, not billed yet`
			: ''

	return (
		<Card className="gap-0 overflow-hidden p-0 shadow-none">
			{/*
			 * Two figures across, the third beneath. Three equal columns forced
			 * the biggest number on the page to share its width with two others,
			 * and the owed figure — the one the page exists to answer — collided
			 * with its neighbour before the layout ever reached a breakpoint.
			 *
			 * The split is also the right one by meaning: owed and late are the
			 * live question, and what has been paid is settled history that reads
			 * as a footnote to the amount above it.
			 */}
			<CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
				<div className="flex min-w-0 flex-col gap-6">
					<div className="min-w-0">
						<p className="text-muted-foreground text-sm">
							{tenantName} still owes you
						</p>
						<p className="mt-1.5 text-4xl font-bold tracking-tight">
							{amount(money.owes)}
						</p>
						<p className="text-muted-foreground mt-1.5 text-sm">
							over the rest of the term
						</p>
					</div>

					<div className="min-w-0 border-l pl-4">
						<p className="text-muted-foreground text-sm">They’ve paid you</p>
						<p className="mt-1.5 text-xl font-bold tracking-tight">
							{amount(money.paidToDate)}
						</p>
						<p className="text-muted-foreground mt-1.5 text-sm">
							since they moved in
						</p>
					</div>
				</div>

				<div className="min-w-0 md:border-l md:pl-6">
					<p className="text-muted-foreground text-sm">
						{late ? 'Late right now' : 'Anything late?'}
					</p>
					<p
						className={cn(
							'mt-1.5 font-bold tracking-tight',
							late ? 'text-warning text-3xl' : 'text-success text-xl',
						)}
					>
						{late ? amount(money.lateTotal) : 'Nothing’s late'}
					</p>
					<p
						className={cn(
							'mt-1.5 text-sm leading-relaxed',
							late ? 'text-warning' : 'text-muted-foreground',
						)}
					>
						{late
							? lateLine
							: `${tenantName} has paid everything that has come due`}
					</p>
				</div>
			</CardContent>

			<div className="bg-muted/50 flex flex-wrap items-center gap-4 border-t p-5">
				<p className="text-muted-foreground min-w-56 flex-1 text-sm leading-relaxed">
					{/*
					 * Only when Rentloop is the one sending it. `nextIssue` returns
					 * null on a manual account — the sweep skips it entirely — so
					 * naming a date would be the page claiming something the product
					 * does not do.
					 */}
					{nextIssue ? (
						<>
							Their next bill goes out on its own —{' '}
							<b className="text-foreground">{amount(nextIssue.amount)}</b> on{' '}
							<b className="text-foreground">{day(nextIssue.issueOn)}</b>
							{/* Counted, not totalled: "including 2 fees you added" tells
							    you what to go and look at, where a lump sum only
							    re-states part of the figure already above it. */}
							{money.comingFees.length > 0
								? `, including ${money.comingFees.length} ${money.comingFees.length === 1 ? 'fee' : 'fees'} you added`
								: ''}
							.
						</>
					) : money.comingRent.length > 0 || money.comingFees.length > 0 ? (
						'Nothing goes out on its own — you send the bills yourself.'
					) : (
						'Everything for this term has been billed.'
					)}
				</p>

				{!readonly ? (
					<div className="flex flex-wrap gap-2">
						<Button variant="outline" onClick={onAddFee}>
							<Plus className="size-4" />
							Add a fee
						</Button>
						{/*
						 * Only while there is something unbilled to put money against.
						 * This button collects against charges, so once every one of
						 * them is on a bill it has nothing to offer — money owed on a
						 * bill already sent is recorded from that bill's own row.
						 */}
						{canCollect ? (
							<Button onClick={onPay}>
								<Check className="size-4" />
								{tenantName} paid me
							</Button>
						) : null}
					</div>
				) : null}
			</div>
		</Card>
	)
}
