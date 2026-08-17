import { useQueryClient } from '@tanstack/react-query'
import { Mail, Pencil, Phone } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { type NextIssue, uninvoiced } from './account'
import { useUpdateBillingPolicy } from '~/api/financial-accounts'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import {
	type CollectionChoice,
	cadenceForChoice,
	choiceForPolicy,
} from '~/lib/cadence'
import { QUERY_KEYS } from '~/lib/constants'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import type { LeaseMoney } from '~/lib/lease-money'
import { cn } from '~/lib/utils'

const PLAN_WORDS: Record<CollectionChoice, string> = {
	monthly: 'every month',
	quarterly: 'every three months',
	'whole-term': 'once, for the rest of the term',
	manual: 'only when you send one',
}

/**
 * The three things a landlord asks once the money is running: when do bills go
 * out, what happens if they fall behind, and can I still change the rent.
 */
export function MoneyRail({
	summary,
	money,
	nextIssue,
	tenantName,
	tenantPhone,
	tenantEmail,
	readonly,
	clientId,
	propertyId,
}: {
	summary: AccountSummary
	money: LeaseMoney
	nextIssue: Nullable<NextIssue>
	tenantName: string
	tenantPhone: Nullable<string>
	tenantEmail: Nullable<string>
	readonly: boolean
	clientId: string
	propertyId: string
}) {
	const queryClient = useQueryClient()
	const updatePolicy = useUpdateBillingPolicy()
	const [editing, setEditing] = useState(false)

	const currency = summary.account.currency
	const amount = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)
	const leadDays = summary.account.auto_issue_days_before
	const choice = choiceForPolicy(
		summary.account.rent_billing_cadence,
		summary.account.rent_billing_interval,
	)

	const monthsLeft = money.comingRent.length
	const rent = money.comingRent[0]?.amount ?? 0
	// L3 — the next bill sweeps in every fee already due, so pricing an option
	// from the rent alone would understate what the tenant is asked for.
	const sweep = money.comingFees.reduce(
		(sum, charge) => sum + uninvoiced(charge),
		0,
	)

	const options: Array<[CollectionChoice, string, string]> = [
		[
			'monthly',
			'Every month',
			`${monthsLeft} more bills · first ${amount(rent + sweep)}, then ${amount(rent)}`,
		],
		[
			'quarterly',
			'Every three months',
			`${Math.ceil(monthsLeft / 3) || 1} more bills · first ${amount(rent * Math.min(3, monthsLeft) + sweep)}`,
		],
		[
			'whole-term',
			'The rest in one bill',
			`1 bill of ${amount(rent * monthsLeft + sweep)}`,
		],
		['manual', 'I’ll send them myself', 'Nothing goes out on its own'],
	]

	const save = (next: CollectionChoice) => {
		updatePolicy.mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				account_id: summary.account.id,
				// The mapping lives in ~/lib/cadence.ts and is never rebuilt inline:
				// "the rest in one bill" stores MANUAL rather than UPFRONT, and
				// monthly stores EVERY_PERIOD rather than an interval of 1.
				data: {
					...cadenceForChoice(next),
					auto_issue_days_before: leadDays,
				},
			},
			{
				onSuccess: () => {
					toast.success('Saved.')
					setEditing(false)
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.INVOICES],
					})
				},
				onError: () => toast.error('Could not save that. Please try again.'),
			},
		)
	}

	return (
		<div className="flex flex-col gap-4">
			<Card className="shadow-none">
				<CardContent>
					<p className="font-bold">How their bills go out</p>

					{editing ? (
						<>
							<p className="text-muted-foreground mt-2 text-sm leading-relaxed">
								This only changes bills that haven&rsquo;t gone out yet. The{' '}
								{money.waiting.length + money.paid.length} they already have
								keep their dates and amounts.
							</p>
							<div className="mt-3 flex flex-col gap-2">
								{options.map(([option, label, sub]) => (
									<Button
										key={option}
										variant={choice === option ? 'default' : 'outline'}
										size="sm"
										className="h-auto flex-col items-start gap-0.5 py-2 text-left whitespace-normal"
										disabled={updatePolicy.isPending}
										onClick={() => save(option)}
									>
										<span className="font-semibold">{label}</span>
										<span
											className={cn(
												'text-xs font-normal',
												choice === option
													? 'opacity-80'
													: 'text-muted-foreground',
											)}
										>
											{sub}
										</span>
									</Button>
								))}
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setEditing(false)}
								>
									{updatePolicy.isPending ? <Spinner /> : null}
									Cancel
								</Button>
							</div>
						</>
					) : (
						<>
							<p className="mt-2 text-sm leading-relaxed">
								{nextIssue ? (
									<>
										We email {tenantName} a bill <b>{PLAN_WORDS[choice]}</b>,{' '}
										{leadDays} days before it&rsquo;s due. {monthsLeft} more to
										come
										{sweep > 0 ? (
											<>
												, and the next one carries {amount(sweep)} of fees
												you&rsquo;ve added
											</>
										) : null}
										.
									</>
								) : (
									<>
										Nothing goes out on its own — you send {tenantName} a bill
										when you want one.
									</>
								)}
							</p>
							{!readonly ? (
								<Button
									variant="ghost"
									size="sm"
									className="text-primary mt-3 -ml-2"
									onClick={() => setEditing(true)}
								>
									<Pencil className="size-3.5" />
									Change how often
								</Button>
							) : null}
						</>
					)}
				</CardContent>
			</Card>

			<Card className="shadow-none">
				<CardContent>
					<p className="font-bold">If they fall behind</p>
					<p className="mt-2 text-sm leading-relaxed">
						{money.lateTotal > 0
							? `${tenantName} is behind by ${amount(money.lateTotal)}. You can nudge them yourself, or record a part payment if they’re paying in bits.`
							: 'We remind them the day a bill is due, then again a week later. You’ll see it here the moment something goes late.'}
					</p>
					<div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
						{tenantEmail ? (
							<Button variant="outline" size="sm" asChild>
								<a href={`mailto:${tenantEmail}`}>
									<Mail className="size-3.5" />
									Send a reminder
								</a>
							</Button>
						) : null}
						{tenantPhone ? (
							<Button variant="outline" size="sm" asChild>
								<a href={`tel:${tenantPhone}`}>
									<Phone className="size-3.5" />
									Call them
								</a>
							</Button>
						) : null}
					</div>
				</CardContent>
			</Card>

			<Card className="shadow-none">
				<CardContent>
					<p className="font-bold">Their rent</p>
					<p className="mt-2 text-sm leading-relaxed">
						<b>{amount(rent)} a month.</b> {tenantName} has already paid rent on
						this lease, so this is fixed — to charge them something different,
						add a fee.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
