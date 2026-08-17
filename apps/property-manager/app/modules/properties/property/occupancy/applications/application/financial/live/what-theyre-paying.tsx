import { CalendarDays, ChevronRight, Receipt, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatDay } from '../../move-in/term'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { cn } from '~/lib/utils'

/**
 * Everything owed over the term, with the rent run summarised as one row.
 *
 * The old page listed twelve identical rent rows and called them charges. The
 * run is one line here, and the individual dates are one tap away.
 *
 * The summary line is load-bearing for the e2e suite: `chargesSummary` parses
 * "{n} payments · {total}" and three cases read it. Changing that wording
 * means changing `e2e/lib/expect.ts` with it.
 */
export function WhatTheyrePaying({
	charges,
	currency,
	readonly,
	onRemove,
}: {
	charges: ChargeInstance[]
	currency: string
	readonly: boolean
	onRemove: (charge: ChargeInstance) => void
}) {
	const [openRent, setOpenRent] = useState(false)
	const [showRemoved, setShowRemoved] = useState(false)

	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const live = charges.filter((charge) => !charge.voided_at)
	const removed = charges.filter((charge) => charge.voided_at)
	const rent = live
		.filter((charge) => charge.category === 'RENT')
		.sort(
			(a, b) =>
				new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
		)
	const fees = live.filter((charge) => charge.category !== 'RENT')

	const rentTotal = rent.reduce((sum, charge) => sum + charge.amount, 0)
	// Removed charges stay on the record but are excluded from every total.
	const total = live.reduce((sum, charge) => sum + charge.amount, 0)

	return (
		<Card className="shadow-none">
			<CardContent>
				<p className="text-lg font-bold">What they&rsquo;re paying</p>
				<p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
					Everything owed over the term. We bill it for you as each date comes
					up.
				</p>

				<div className="mt-4 rounded-xl border px-4">
					{rent.length > 0 ? (
						<div className="border-b last:border-b-0">
							<button
								type="button"
								onClick={() => setOpenRent(!openRent)}
								className="flex w-full items-center gap-3 py-4 text-left"
							>
								<span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
									<CalendarDays className="size-4" />
								</span>
								<span className="min-w-0 flex-1">
									<span className="block font-semibold">
										{/* The e2e contract string. */}
										{rent.length} payments · {money(rentTotal)}
									</span>
									<span className="text-muted-foreground mt-0.5 block text-xs">
										{formatDay(new Date(rent[0]!.due_date))} to{' '}
										{formatDay(new Date(rent[rent.length - 1]!.due_date))}
									</span>
								</span>
								<ChevronRight
									className={cn(
										'text-muted-foreground size-4 shrink-0',
										openRent ? 'rotate-90' : '',
									)}
								/>
							</button>

							{openRent ? (
								<div className="pb-3 pl-12">
									{rent.map((charge, index) => (
										<div
											key={charge.id}
											className={cn(
												'flex items-center gap-3 py-2',
												index === 0 ? '' : 'border-t',
											)}
										>
											<span className="min-w-0 flex-1 text-sm">
												{charge.name}
											</span>
											<span className="text-muted-foreground text-xs">
												due {formatDay(new Date(charge.due_date))}
											</span>
											<span className="text-sm font-semibold">
												{money(charge.amount)}
											</span>
											{!readonly && charge.invoiced_amount === 0 ? (
												<Button
													variant="ghost"
													size="icon"
													aria-label={`Remove ${charge.name}`}
													onClick={() => onRemove(charge)}
												>
													<Trash2 className="size-3.5" />
												</Button>
											) : null}
										</div>
									))}
								</div>
							) : null}
						</div>
					) : null}

					{fees.map((charge) => (
						<div
							key={charge.id}
							className="flex items-center gap-3 border-b py-4 last:border-b-0"
						>
							<span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
								<Receipt className="size-4" />
							</span>
							<span className="min-w-0 flex-1">
								<span className="block font-semibold">{charge.name}</span>
								<span className="text-muted-foreground mt-0.5 block text-xs">
									One time ·{' '}
									{charge.settled_amount >= charge.amount
										? 'paid'
										: `due ${formatDay(new Date(charge.due_date))}`}
								</span>
							</span>
							<span className="font-semibold whitespace-nowrap">
								{money(charge.amount)}
							</span>
							{!readonly && charge.invoiced_amount === 0 ? (
								<Button
									variant="ghost"
									size="icon"
									aria-label={`Remove ${charge.name}`}
									onClick={() => onRemove(charge)}
								>
									<Trash2 className="size-3.5" />
								</Button>
							) : null}
						</div>
					))}

					<div className="flex items-baseline justify-between gap-3 border-t py-4">
						<span className="font-bold">Over the whole term</span>
						<span className="text-xl font-bold">{money(total)}</span>
					</div>
				</div>

				{removed.length > 0 ? (
					<div className="mt-3">
						<button
							type="button"
							onClick={() => setShowRemoved(!showRemoved)}
							className="text-muted-foreground text-sm font-semibold hover:underline"
						>
							{showRemoved
								? 'Hide removed fees'
								: `Show ${removed.length} removed fee${removed.length === 1 ? '' : 's'}`}
						</button>
						{showRemoved ? (
							<div className="mt-2 rounded-xl border px-4">
								{removed.map((charge, index) => (
									<div
										key={charge.id}
										className={cn(
											'flex items-center gap-3 py-3 opacity-60',
											index === 0 ? '' : 'border-t',
										)}
									>
										<span className="min-w-0 flex-1 text-sm line-through">
											{charge.name}
										</span>
										<span className="text-muted-foreground text-xs">
											{charge.voided_reason ?? 'Removed'}
										</span>
										<span className="text-sm">{money(charge.amount)}</span>
									</div>
								))}
							</div>
						) : null}
						<p className="text-muted-foreground mt-2 text-xs leading-relaxed">
							Removed fees stay on the record but are left out of every total.
							Fees can&rsquo;t be edited — remove one and add another.
						</p>
					</div>
				) : null}
			</CardContent>
		</Card>
	)
}
