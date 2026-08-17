import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { PERIOD_NOUN, formatDay } from '../../move-in/term'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import type { CollectionChoice } from '~/lib/cadence'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { type Pronouns, verb } from '~/lib/pronouns'
import type { PaymentFrequency, SchedulePeriod } from '~/lib/schedule'
import { cn } from '~/lib/utils'

const ORDINAL = (n: number) => {
	const rem100 = n % 100
	if (rem100 >= 11 && rem100 <= 13) return `${n}th`
	return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

/**
 * The panel that says what will happen, in the words a landlord would use,
 * before anything is saved.
 *
 * Every date comes from the same `buildSchedule` the server's own derivation
 * mirrors — nothing here is arithmetic done twice.
 */
export function PlainSummary({
	rentMinor,
	feeTotal,
	periods,
	choice,
	currency,
	frequency,
	applicantName,
	pronouns,
	leadDays,
	busy,
	onStart,
}: {
	rentMinor: number
	feeTotal: number
	periods: SchedulePeriod[]
	choice: CollectionChoice
	currency: string
	frequency: PaymentFrequency
	applicantName: string
	pronouns: Pronouns
	leadDays: number
	busy: boolean
	onStart: () => void
}) {
	const [showDates, setShowDates] = useState(false)
	const noun = PERIOD_NOUN[frequency]
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const ready = rentMinor > 0 && periods.length > 0
	const first = periods[0]
	const last = periods[periods.length - 1]
	const total = rentMinor * periods.length + feeTotal

	const planLine: Record<CollectionChoice, string> = {
		monthly: `You send ${pronouns.object} a bill every ${noun}.`,
		quarterly: `You send ${pronouns.object} a bill every three months.`,
		'whole-term': `You send ${pronouns.object} one bill for the whole term.`,
		manual: `You send bills yourself, whenever you want.`,
	}

	return (
		<div className="flex flex-col gap-4">
			<Card className="gap-0 overflow-hidden p-0 shadow-none">
				<div className="bg-primary/5 border-b p-5">
					<p className="font-bold">In plain words</p>
					<p className="mt-2.5 text-sm leading-relaxed">
						{ready && first && last ? (
							<>
								<b>{applicantName}</b> pays <b>{money(rentMinor)}</b> rent each{' '}
								{noun}, due on the{' '}
								<b>{ORDINAL(new Date(first.dueDate).getUTCDate())}</b>. That
								runs to <b>{formatDay(new Date(last.dueDate))}</b>.
								{feeTotal > 0 ? (
									<>
										{' '}
										On top of that {pronouns.subject}{' '}
										{verb(pronouns, 'pay')} <b>{money(feeTotal)}</b> in
										one-time fees when {pronouns.subject}{' '}
										{verb(pronouns, 'move')} in.
									</>
								) : null}{' '}
								{planLine[choice]}
							</>
						) : (
							'Fill in the rent and this will explain what you have set up, in ordinary words, before anything is saved.'
						)}
					</p>
				</div>

				{ready && first ? (
					<CardContent className="pt-5">
						{[
							[
								`${applicantName}’s first bill`,
								money(rentMinor + feeTotal),
								`Sent ${formatDay(
									new Date(
										new Date(first.dueDate).getTime() -
											leadDays * 86_400_000,
									),
								)}`,
							],
							[`Every ${noun} after`, money(rentMinor), `${periods.length} in total`],
							[
								'Over the whole term',
								money(total),
								feeTotal > 0
									? `${periods.length} payments, plus fees`
									: `${periods.length} payments`,
							],
						].map(([label, amount, sub], index) => (
							<div
								key={label}
								className={cn(
									'flex items-center gap-3 py-2.5',
									index === 0 ? '' : 'border-t',
								)}
							>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold">{label}</p>
									<p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>
								</div>
								<span
									className={cn(
										'font-bold whitespace-nowrap',
										index === 2 ? 'text-lg' : 'text-sm',
									)}
								>
									{amount}
								</span>
							</div>
						))}

						<button
							type="button"
							onClick={() => setShowDates(!showDates)}
							className="text-primary mt-2 flex items-center gap-2 text-sm font-semibold hover:underline"
						>
							<ChevronRight
								className={cn('size-4', showDates ? 'rotate-90' : '')}
							/>
							{showDates
								? 'Hide the dates'
								: `See all ${periods.length} rent dates`}
						</button>

						{showDates ? (
							<div className="mt-3 rounded-xl border px-3">
								{periods.map((period, index) => (
									<div
										key={period.dueDate.toISOString()}
										className={cn(
											'flex justify-between py-2 text-sm',
											index === 0 ? '' : 'border-t',
										)}
									>
										<span>{period.name}</span>
										<span className="text-muted-foreground">
											due {formatDay(period.dueDate)}
										</span>
									</div>
								))}
							</div>
						) : null}
					</CardContent>
				) : null}
			</Card>

			<div>
				<Button
					id="start-billing"
					className="w-full"
					size="lg"
					disabled={!ready || busy}
					onClick={onStart}
				>
					{busy ? <Spinner /> : null}
					Save this and start billing
				</Button>
				<p className="text-muted-foreground mt-3 text-sm leading-relaxed">
					{ready
						? `Nothing is sent to ${applicantName} today. You can still change the rent until ${pronouns.possessive} first payment arrives.`
						: 'Answer the questions and this will turn on.'}
				</p>
			</div>
		</div>
	)
}
