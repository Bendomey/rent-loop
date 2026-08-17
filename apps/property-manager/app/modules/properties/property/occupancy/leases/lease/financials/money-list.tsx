import {
	CalendarDays,
	Check,
	ChevronRight,
	Plus,
	Receipt,
	Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { type NextIssue } from './account'
import { BillGroupCard } from './bill-group'
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

/** Past this many, the rent run stops being countable and becomes a wall. */
const RUN_CAP = 12

function SectionHead({
	title,
	total,
	note,
	right,
}: {
	title: string
	total: string
	note: string
	right?: React.ReactNode
}) {
	return (
		<div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
			<h3 className="text-lg font-bold tracking-tight">{title}</h3>
			<span className="text-muted-foreground font-bold">{total}</span>
			<span className="text-muted-foreground min-w-40 flex-1 text-sm">
				{note}
			</span>
			{right}
		</div>
	)
}

/**
 * Everything owed, as one listing.
 *
 * Bills and charges were two lists that double-counted the same money — a
 * landlord saw "November rent" twice and had to work out they were the same
 * thing. Here every item appears exactly once, and the sections are ordered by
 * what you would do about it: chase it, wait for it, or nothing.
 */
export function MoneyList({
	money,
	nextIssue,
	currency,
	tenantName,
	readonly,
	onPay,
	onAddFee,
	onRemoveFee,
}: {
	money: LeaseMoney
	nextIssue: Nullable<NextIssue>
	currency: string
	tenantName: string
	readonly: boolean
	onPay: (invoice: Invoice) => void
	onAddFee: () => void
	onRemoveFee: (charge: ChargeInstance) => void
}) {
	const [openRun, setOpenRun] = useState(false)
	const [openPaid, setOpenPaid] = useState(false)
	const [showAllRun, setShowAllRun] = useState(false)

	const amount = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	return (
		<Card className="shadow-none">
			<CardContent>
				<div className="mb-6">
					<h2 className="text-lg font-bold tracking-tight">
						{tenantName}&rsquo;s money, in order
					</h2>
					<p className="text-muted-foreground mt-1.5 max-w-2xl text-sm leading-relaxed">
						Everything they owe appears once. Bills group the things that went
						out together — they pay a bill, not a line.
					</p>
				</div>

				{/* ── waiting on them ─────────────────────────────────────────── */}
				{money.waiting.length > 0 ? (
					<div id="waiting-on-them" className="mb-8">
						<SectionHead
							title="Waiting on them"
							total={amount(money.waitingTotal)}
							note={
								money.waitingLate > 0
									? money.waitingLate === money.waitingTotal
										? 'all of it is late'
										: `${amount(money.waitingLate)} of it is late`
									: 'nothing late yet'
							}
						/>
						<div className="flex flex-col gap-3">
							{money.waiting.map((group) => (
								<BillGroupCard
									key={group.invoice.id}
									group={group}
									currency={currency}
									tenantName={tenantName}
									readonly={readonly}
									onPay={onPay}
								/>
							))}
						</div>
					</div>
				) : null}

				{/* ── still to come ───────────────────────────────────────────── */}
				<div id="still-to-come" className="mb-8">
					<SectionHead
						title="Still to come"
						total={amount(money.comingTotal)}
						note={
							nextIssue
								? 'not billed yet — each goes out on its date'
								: 'not billed yet — you send these yourself'
						}
						right={
							!readonly ? (
								<Button variant="outline" size="sm" onClick={onAddFee}>
									<Plus className="size-3.5" />
									Add a fee
								</Button>
							) : undefined
						}
					/>

					{/*
					 * Fees and the rent run interleave by date rather than fees always
					 * coming first: a fee dated after the run starts belongs after it,
					 * and listing every fee above put a February fee over November rent.
					 */}
					<div className="rounded-xl border px-4">
						{money.coming.map((item, index) => {
							const border = index === 0 ? '' : 'border-t'

							if (item.kind === 'fee') {
								const charge = item.charge
								const overdue = new Date(charge.due_date) < new Date()
								return (
									<div
										key={charge.id}
										data-charge={charge.id}
										className={cn(
											'flex flex-wrap items-center gap-3 py-3',
											border,
										)}
									>
										<span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
											<Receipt className="size-4" />
										</span>
										<span className="min-w-0 flex-1">
											<span className="block truncate font-semibold">
												{charge.name}
											</span>
											<span
												className={cn(
													'mt-0.5 block text-xs',
													overdue ? 'text-warning' : 'text-muted-foreground',
												)}
											>
												{overdue ? 'was due' : 'due'} {day(charge.due_date)}
												{nextIssue
													? ` · goes on the ${day(nextIssue.issueOn)} bill`
													: ''}
											</span>
										</span>
										<span className="font-bold whitespace-nowrap">
											{amount(charge.amount - charge.invoiced_amount)}
										</span>
										{/* L7 — only a fee no bill has claimed can be removed. */}
										{!readonly && charge.invoiced_amount === 0 ? (
											<Button
												variant="ghost"
												size="icon"
												aria-label={`Remove ${charge.name}`}
												onClick={() => onRemoveFee(charge)}
											>
												<Trash2 className="size-3.5" />
											</Button>
										) : null}
									</div>
								)
							}

							const run = item.run
							const shownRun = showAllRun ? run : run.slice(0, RUN_CAP)
							const hiddenRun = run.length - shownRun.length
							const runTotal = run.reduce((sum, c) => sum + c.amount, 0)

							return (
								<div key="rent-run" className={border}>
									<button
										type="button"
										onClick={() => setOpenRun(!openRun)}
										className="flex w-full items-center gap-3 py-3 text-left"
									>
										<ChevronRight
											className={cn(
												'text-muted-foreground size-4 shrink-0',
												openRun ? 'rotate-90' : '',
											)}
										/>
										<span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
											<CalendarDays className="size-4" />
										</span>
										<span className="min-w-0 flex-1">
											<span className="block font-semibold">
												{run.length} more{' '}
												{run.length === 1 ? 'month' : 'months'} of rent
											</span>
											<span className="text-muted-foreground mt-0.5 block text-xs">
												{day(run[0]!.due_date)} to{' '}
												{day(run[run.length - 1]!.due_date)} ·{' '}
												{amount(run[0]!.amount)} each
											</span>
										</span>
										<span className="font-bold whitespace-nowrap">
											{amount(runTotal)}
										</span>
									</button>

									{openRun ? (
										<div className="pb-3 pl-16">
											{shownRun.map((charge, i) => (
												<div
													key={charge.id}
													data-charge={charge.id}
													className={cn(
														'flex items-center gap-3 py-2',
														i === 0 ? '' : 'border-t',
													)}
												>
													<span className="min-w-0 flex-1 truncate text-sm">
														{charge.name}
													</span>
													<span className="text-muted-foreground text-xs">
														due {day(charge.due_date)}
													</span>
													<span className="min-w-24 text-right text-sm font-semibold">
														{amount(charge.amount)}
													</span>
												</div>
											))}
											{hiddenRun > 0 ? (
												<button
													type="button"
													onClick={() => setShowAllRun(true)}
													className="text-primary border-t pt-2 text-sm font-semibold hover:underline"
												>
													Show {hiddenRun} more
												</button>
											) : null}
										</div>
									) : null}
								</div>
							)
						})}

						{money.coming.length === 0 ? (
							<p className="text-muted-foreground py-6 text-center text-sm">
								Everything has been billed.
							</p>
						) : null}
					</div>
				</div>

				{/* ── paid ────────────────────────────────────────────────────── */}
				{money.paid.length > 0 ? (
					<div>
						<SectionHead
							title="Paid"
							total={amount(money.paidTotal)}
							note={`${money.paid.length} ${money.paid.length === 1 ? 'bill' : 'bills'} settled`}
							right={
								<button
									type="button"
									onClick={() => setOpenPaid(!openPaid)}
									className="text-primary text-sm font-semibold hover:underline"
								>
									{openPaid ? 'Hide' : 'Show these'}
								</button>
							}
						/>

						{openPaid ? (
							<div className="flex flex-col gap-3">
								{money.paid.map((group) => (
									<BillGroupCard
										key={group.invoice.id}
										group={group}
										currency={currency}
										tenantName={tenantName}
										readonly={readonly}
									/>
								))}
							</div>
						) : (
							/*
							 * Named by what each bill was for, not when it went out.
							 * Several bills raised the same day all read "Bill sent 17
							 * Aug 2026", which distinguishes nothing — the whole row
							 * became a date the landlord already knew.
							 */
							<div className="rounded-xl border px-4">
								{money.paid.map((group, index) => (
									<div
										key={group.invoice.id}
										className={cn(
											'flex items-center gap-3 py-3',
											index === 0 ? '' : 'border-t',
										)}
									>
										<Check className="text-success size-4 shrink-0" />
										<span className="min-w-0 flex-1">
											<span className="block truncate text-sm font-semibold">
												{billLabel(group)}
											</span>
											<span className="text-muted-foreground mt-0.5 block text-xs">
												{group.invoice.paid_at
													? `${tenantName} paid on ${day(group.invoice.paid_at)}`
													: 'paid in full'}
											</span>
										</span>
										<span className="font-semibold whitespace-nowrap">
											{amount(group.invoice.total_amount)}
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				) : null}

				{/*
				 * What the whole term comes to. The sections above are ordered by
				 * what you would do about the money; this is the one line that says
				 * how much there is of it altogether.
				 */}
				<div className="mt-8 flex flex-wrap items-baseline justify-between gap-3 border-t pt-5">
					<span className="font-bold">
						{money.chargeCount} payments · {amount(money.totalCharged)}
					</span>
					<span className="text-muted-foreground text-sm">
						over the whole term
					</span>
				</div>
			</CardContent>
		</Card>
	)
}
