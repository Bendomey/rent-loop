import { Check, Plus, TriangleAlert } from 'lucide-react'
import { formatDay } from '../../move-in/term'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import type { AccountView } from '~/lib/account-view'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { type Pronouns, hasHave, verb } from '~/lib/pronouns'
import { cn } from '~/lib/utils'

/**
 * The one sentence the running view exists to say: what is still owed.
 *
 * Everything here is derived — `deriveAccountView` reads the ledger, so this
 * cannot state a figure the rows underneath disagree with.
 */
export function OwedHeader({
	view,
	currency,
	applicantName,
	pronouns,
	readonly,
	/**
	 * On a manual plan nothing is issued automatically, so neither the issue
	 * date nor "it goes out on its own" is true — the landlord sends it, and
	 * the date that matters is when it falls due.
	 */
	autoIssues,
	onRecordPayment,
	onAddFee,
}: {
	view: AccountView
	currency: string
	applicantName: string
	pronouns: Pronouns
	readonly: boolean
	autoIssues: boolean
	onRecordPayment: () => void
	onAddFee: () => void
}) {
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)
	const late = view.lateTotal > 0

	return (
		<Card className="shadow-none">
			<CardContent>
				<div className="flex flex-col gap-6 lg:flex-row">
					<div className="min-w-0 flex-1">
						<p className="text-muted-foreground text-sm">
							{applicantName} still owes you
						</p>
						<p className="mt-1.5 text-4xl font-bold tracking-tight">
							{money(view.owed)}
						</p>

						<div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
							{late ? (
								<TriangleAlert className="text-warning size-4 shrink-0" />
							) : (
								<Check className="text-success size-4 shrink-0" />
							)}
							<span
								className={cn(
									'text-sm font-semibold',
									late ? 'text-warning' : 'text-success',
								)}
							>
								{late
									? `${money(view.lateTotal)} of that is late`
									: 'Nothing is late'}
							</span>
							<span className="text-muted-foreground text-sm">
								{view.paid > 0
									? `· ${pronouns.subject} ${hasHave(pronouns)} paid ${money(view.paid)} so far`
									: `· ${pronouns.subject} ${hasHave(pronouns)}n’t paid anything yet`}
							</span>
						</div>
					</div>

					{/*
					 * Only when Rentloop is the one sending it. On a manual plan
					 * nothing is scheduled, so naming a "next bill" and a date would
					 * be the page claiming something the product does not do — the
					 * landlord decides when, and there is nothing to predict.
					 */}
					{autoIssues ? (
						<div className="lg:w-72 lg:border-l lg:pl-6">
							<p className="text-muted-foreground text-sm">
								{applicantName}&rsquo;s next bill
							</p>
							<p className="mt-1.5 text-lg font-bold">
								{view.next
									? `${money(view.next.amount)} on ${formatDay(view.next.issueOn)}`
									: '—'}
							</p>
							<p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
								{view.next
									? `${view.next.rentLabel}${
											view.next.feeNames.length > 0
												? `, plus ${view.next.feeNames.join(' and ').toLowerCase()}`
												: ''
										}. It goes out on its own.`
									: 'Everything has been billed already.'}
							</p>
						</div>
					) : null}
				</div>

				{!readonly ? (
					<div className="mt-5 flex flex-wrap gap-2 border-t pt-5">
						<Button onClick={onRecordPayment}>
							<Check className="size-4" />
							{applicantName} paid me
						</Button>
						<Button variant="outline" onClick={onAddFee}>
							<Plus className="size-4" />
							Add a fee
						</Button>
					</div>
				) : null}
			</CardContent>
		</Card>
	)
}
