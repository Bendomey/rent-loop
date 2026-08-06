import { CalendarRange } from 'lucide-react'
import { TermBar } from './term-bar'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import type { PaymentFrequency, SchedulePeriod } from '~/lib/schedule'

interface TermSummaryProps {
	start: Nullable<Date>
	/** Exclusive — the first instant after the term. */
	end: Nullable<Date>
	duration: number
	frequency: PaymentFrequency
	periods: SchedulePeriod[]
	rent: number
	currency: string
	/** True once the landlord has stated a rent, rather than the unit's listing. */
	rentAgreed: boolean
	freeFrom?: Nullable<Date>
}

/**
 * What the two decisions actually produce.
 *
 * The end date is the one number everybody wants and the old step never showed
 * — it was derivable from three read-only fields and therefore derived by
 * nobody.
 */
export function TermSummary({
	start,
	end,
	duration,
	frequency,
	periods,
	rent,
	currency,
	rentAgreed,
	freeFrom,
}: TermSummaryProps) {
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	return (
		<div className="bg-muted h-fit rounded-2xl p-5">
			<p className="text-sm font-bold">The term this creates</p>

			{!start || !end ? (
				<div className="px-2 py-8 text-center">
					<CalendarRange className="text-muted-foreground mx-auto size-6" />
					<p className="text-muted-foreground mx-auto mt-3 max-w-[250px] text-xs leading-relaxed">
						Pick a move-in date and the term, its end date and every rent charge
						appear here.
					</p>
				</div>
			) : (
				<>
					<div className="mt-4">
						<TermBar
							start={start}
							end={end}
							duration={duration}
							frequency={frequency}
							periods={periods}
							freeFrom={freeFrom}
						/>
					</div>

					<div className="mt-4 flex flex-col gap-2.5 border-t pt-3.5">
						<div className="flex justify-between gap-3">
							<span className="text-muted-foreground text-xs">
								Rent charges
							</span>
							<span className="text-xs font-bold tabular-nums">
								{periods.length} × {money(rent)}
							</span>
						</div>
						<div className="flex justify-between gap-3">
							<span className="text-muted-foreground text-xs">
								Value over the term
							</span>
							<span className="text-xs font-bold tabular-nums">
								{money(rent * periods.length)}
							</span>
						</div>
					</div>

					<p className="text-muted-foreground mt-3.5 text-[11px] leading-relaxed">
						{rentAgreed
							? 'Financial setup builds these charges, at the agreed rent.'
							: 'Financial setup builds these charges. The rent figure is stated there — this is the unit’s listed rent.'}
					</p>
				</>
			)}
		</div>
	)
}
