import { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { Link } from 'react-router'
import {
	buildRows,
	KIND_LABEL,
	KIND_SWATCH,
	nightsWord,
	shortDate,
	type Stretch,
} from './helpers'
import { Button } from '~/components/ui/button'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { cn } from '~/lib/utils'

const PAGE_SIZE = 6

export function AvailabilityListView({
	unit,
	stretches,
	today,
}: {
	unit: PropertyUnit
	stretches: Stretch[]
	today: Dayjs
}) {
	const [page, setPage] = useState(0)
	const rows = buildRows(stretches, today)
	const pages = Math.ceil(rows.length / PAGE_SIZE)
	const current = Math.min(page, pages - 1)
	const slice = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)
	const taken = rows.filter((r) => r.kind !== 'FREE').length
	const nightly = convertPesewasToCedis(unit.rent_fee)
	const bookingsUrl = `/properties/${unit.property_id}/occupancy/bookings/new`

	return (
		<div className="mt-6">
			<p className="text-muted-foreground mb-3 text-sm">
				{taken === 0
					? 'Nobody has this room, as far ahead as your calendar goes.'
					: `${taken === 1 ? 'One stay' : `${taken} stays`} on this room, and the free nights in between.`}
			</p>

			<div className="divide-y overflow-hidden rounded-lg border">
				{slice.map((row, i) => {
					const free = row.kind === 'FREE'
					const isNow = current === 0 && i === 0
					return (
						<div
							key={row.key}
							className={cn(
								'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5',
								!free && 'bg-muted/40',
							)}
						>
							<span
								className={cn(
									'hidden w-1 self-stretch rounded-full sm:block',
									free ? 'bg-emerald-400' : KIND_SWATCH[row.kind],
								)}
							/>
							<div className="flex items-center gap-2 sm:w-56 sm:shrink-0">
								<span
									className={cn(
										'size-3 shrink-0 rounded-sm sm:hidden',
										free ? 'bg-emerald-400' : KIND_SWATCH[row.kind],
									)}
								/>
								<div>
									<div className="text-foreground text-sm font-semibold">
										{isNow ? 'Today' : shortDate(row.from)}
										{row.to ? ` → ${shortDate(row.to)}` : ' onwards'}
									</div>
									<div className="text-muted-foreground mt-0.5 text-xs">
										{row.nights ? nightsWord(row.nights) : 'nothing booked yet'}
									</div>
								</div>
							</div>

							<div className="min-w-0 flex-1">
								<div
									className={cn(
										'text-sm font-medium',
										free
											? 'text-emerald-600 dark:text-emerald-400'
											: 'text-foreground',
									)}
								>
									{free
										? row.nights
											? 'Free — you can let it'
											: 'Free from here on'
										: KIND_LABEL[row.kind]}
								</div>
								<div className="text-muted-foreground mt-0.5 text-xs">
									{free
										? row.nights
											? `${formatAmount(nightly * row.nights, unit.rent_fee_currency)} if someone takes all of it`
											: 'Anyone can book from here'
										: row.reason ||
											(row.kind === 'BOOKING'
												? 'A guest has this room'
												: row.kind === 'LEASE'
													? 'On a lease'
													: 'Off the market')}
								</div>
							</div>

							{free && row.nights ? (
								<Link to={bookingsUrl} className="sm:shrink-0">
									<Button variant="outline" size="sm">
										Let these nights
									</Button>
								</Link>
							) : null}
						</div>
					)
				})}
			</div>

			{pages > 1 ? (
				<div className="mt-4 flex flex-wrap items-center gap-3">
					<span className="text-muted-foreground flex-1 text-sm">
						Showing {current * PAGE_SIZE + 1}–
						{Math.min(rows.length, current * PAGE_SIZE + PAGE_SIZE)} of{' '}
						{rows.length}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={current === 0}
						onClick={() => setPage(current - 1)}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={current === pages - 1}
						onClick={() => setPage(current + 1)}
					>
						Next
					</Button>
				</div>
			) : null}
		</div>
	)
}
