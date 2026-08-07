import { ChevronRight, Trash2 } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { TONE_CLASS, chargeDisplayStatus } from '~/lib/display-status'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

/** The shape both the computed preview and the live ledger can supply. */
export interface RentRow {
	id: string
	name: string
	amount: number
	dueDate: Date
	charge?: ChargeInstance
}

interface RentGroupProps {
	rows: RentRow[]
	currency: string
	open: boolean
	onToggle: () => void
	onRemove?: (charge: ChargeInstance) => void
}

const shortDate = (date: Date) =>
	date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})

const monthYear = (date: Date) =>
	date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })

/**
 * Twelve rent rows collapse into one line so the one-offs — deposit, agency fee
 * — read as the exceptions they are rather than being buried in a list.
 */
export function RentGroup({
	rows,
	currency,
	open,
	onToggle,
	onRemove,
}: RentGroupProps) {
	if (rows.length === 0) return null

	const total = rows.reduce((sum, row) => sum + row.amount, 0)
	const first = rows[0]
	const last = rows[rows.length - 1]
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const paid = rows.filter((r) => r.charge?.status === 'SETTLED').length
	const billed = rows.filter(
		(r) =>
			r.charge?.status === 'INVOICED' ||
			r.charge?.status === 'PARTIALLY_SETTLED',
	).length

	return (
		<div className="border-t first:border-t-0">
			{/* Wrapping row: on a phone the label takes the whole width and the
			    total drops beneath it. Squeezed onto one line the label collapsed
			    to one word per line, because the money can't compress. */}
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 py-3.5 text-left"
			>
				<ChevronRight
					className={`text-muted-foreground size-4 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
				/>
				<div className="min-w-0 basis-[calc(100%-1.75rem)] sm:flex-1 sm:basis-0">
					<p className="text-sm font-semibold">
						{rows.length} rent {rows.length === 1 ? 'charge' : 'charges'}
					</p>
					<p className="text-muted-foreground mt-0.5 text-xs">
						{first && last
							? `${monthYear(first.dueDate)} – ${monthYear(last.dueDate)}`
							: null}
						{first ? ` · ${money(first.amount)} each` : null}
						{paid > 0 ? ` · ${paid} paid` : null}
						{billed > 0 ? ` · ${billed} billed` : null}
					</p>
				</div>
				<span className="ml-7 shrink-0 text-sm font-semibold tabular-nums sm:ml-0">
					{money(total)}
				</span>
				<span className="hidden w-8 sm:block" />
			</button>

			{open ? (
				<div className="pb-2 pl-9">
					{rows.map((row) => {
						const status = row.charge
							? chargeDisplayStatus(row.charge)
							: undefined
						return (
							<div
								key={row.id}
								className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t py-3 first:border-t-0"
							>
								<div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
									<p className="truncate text-sm font-medium">{row.name}</p>
									<p className="text-muted-foreground mt-0.5 text-xs">
										Due {shortDate(row.dueDate)}
									</p>
								</div>
								{status ? (
									<Badge variant="outline" className={TONE_CLASS[status.tone]}>
										{status.label}
									</Badge>
								) : null}
								<span className="ml-auto shrink-0 text-sm font-semibold tabular-nums sm:ml-0 sm:min-w-24 sm:text-right">
									{money(row.amount)}
								</span>
								{onRemove && row.charge ? (
									<Button
										variant="outline"
										size="icon"
										className="size-8 shrink-0"
										aria-label={`Remove ${row.name}`}
										onClick={() => onRemove(row.charge!)}
									>
										<Trash2 className="size-3.5" />
									</Button>
								) : (
									<span className="hidden w-8 shrink-0 sm:block" />
								)}
							</div>
						)
					})}
				</div>
			) : null}
		</div>
	)
}
