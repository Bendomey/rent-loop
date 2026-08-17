import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { toFirstUpperCase } from '~/lib/strings'
import { unavailableReason } from '~/lib/unit-groups'
import { cn } from '~/lib/utils'

/** How many reasons are worth reading before the list becomes a wall. */
const CAP = 8

/**
 * Units that can't be picked stop pretending to be options.
 *
 * The old picker greyed them to 50% and left them in the list, where they took
 * up as much room as the real choices. Here they collapse to one line that
 * says how many, and open to say why each is out.
 */
export function UnavailableList({
	units,
	pronounSubject,
}: {
	units: PropertyUnit[]
	pronounSubject: string
}) {
	const [open, setOpen] = useState(false)
	const [showAll, setShowAll] = useState(false)
	if (units.length === 0) return null

	// A large property can have hundreds of occupied units. The point of this
	// group is that they stop taking up room, so opening it must not replace one
	// wall of options with a longer wall of non-options.
	const shown = showAll ? units : units.slice(0, CAP)
	const hidden = units.length - shown.length

	return (
		<Card className="shadow-none">
			<CardContent>
				<button
					type="button"
					onClick={() => setOpen(!open)}
					className="flex w-full flex-wrap items-center gap-3 text-left"
				>
					<ChevronRight
						className={cn(
							'text-muted-foreground size-4 shrink-0 transition-transform',
							open ? 'rotate-90' : '',
						)}
					/>
					<span className="font-bold">
						{units.length} unit{units.length === 1 ? '' : 's'} {pronounSubject}{' '}
						can&rsquo;t take
					</span>
					<span className="text-muted-foreground text-sm">
						{open ? 'Here’s why' : 'Tap to see which, and why'}
					</span>
				</button>

				{open ? (
					<div className="mt-4">
						{shown.map((unit, index) => (
							<div
								key={unit.id}
								data-unavailable-unit={unit.id}
								className={cn(
									'flex items-center gap-4 py-3',
									index === 0 ? '' : 'border-t',
								)}
							>
								<div className="min-w-0 flex-1">
									<p className="text-muted-foreground truncate text-sm font-semibold">
										{unit.name} · {toFirstUpperCase(unit.type.toLowerCase())}
									</p>
									<p className="text-muted-foreground mt-0.5 text-xs">
										{unavailableReason(unit.status)}
									</p>
								</div>
								<span className="text-muted-foreground shrink-0 text-sm font-semibold">
									{formatAmount(
										convertPesewasToCedis(unit.rent_fee),
										unit.rent_fee_currency,
									)}
								</span>
							</div>
						))}

						{hidden > 0 ? (
							<button
								type="button"
								onClick={() => setShowAll(true)}
								className="text-primary border-t pt-3 text-sm font-semibold hover:underline"
							>
								Show {hidden} more
							</button>
						) : null}
					</div>
				) : null}
			</CardContent>
		</Card>
	)
}
