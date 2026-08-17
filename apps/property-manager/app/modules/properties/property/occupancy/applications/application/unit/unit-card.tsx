import { Building2, Check } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { toFirstUpperCase } from '~/lib/strings'
import { cn } from '~/lib/utils'

// A lookup rather than string surgery: `DAILY.replace('ly','')` yields "a dai".
const PER: Record<PropertyUnit['payment_frequency'], string> = {
	DAILY: 'a day',
	WEEKLY: 'a week',
	MONTHLY: 'a month',
	QUARTERLY: 'a quarter',
	BIANNUALLY: 'every six months',
	ANNUALLY: 'a year',
}

/**
 * One unit, as something you can compare against its neighbours.
 *
 * Deliberately no features row: `PropertyUnit` has no bedroom or bathroom
 * field, and a lone floor area reads as noise. Photo, name, type, rent and
 * availability are what the choice actually turns on.
 */
export function UnitCard({
	unit,
	selected,
	current,
	onSelect,
}: {
	unit: PropertyUnit
	selected: boolean
	current: boolean
	onSelect: () => void
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			data-unit-id={unit.id}
			data-selected={selected ? 'true' : undefined}
			className="text-left"
		>
			<Card
				className={cn(
					'h-full gap-0 overflow-hidden p-0 shadow-none transition-colors',
					selected
						? 'border-primary ring-primary/20 ring-2'
						: 'hover:border-foreground/20',
				)}
			>
				<div className="bg-muted relative aspect-video w-full">
					{unit.images?.[0] ? (
						<img
							src={unit.images[0]}
							alt={unit.name}
							className="size-full object-cover"
						/>
					) : (
						<div className="text-muted-foreground flex size-full items-center justify-center">
							<Building2 className="size-7" />
						</div>
					)}

					<div className="absolute top-3 left-3 flex gap-2">
						<Badge className="bg-success-bg text-success border-none">
							Free now
						</Badge>
						{current ? <Badge variant="secondary">Current</Badge> : null}
					</div>

					{selected ? (
						<div className="bg-primary text-primary-foreground absolute top-3 right-3 flex size-7 items-center justify-center rounded-full">
							<Check className="size-4" />
						</div>
					) : null}
				</div>

				<div className="p-4">
					{/* Unit names can be long. Truncate rather than wrap to three
					    lines and shove the price out of alignment across the grid. */}
					<div className="flex items-baseline gap-2">
						<span className="min-w-0 truncate font-bold" title={unit.name}>
							{unit.name}
						</span>
						<span className="text-muted-foreground shrink-0 text-sm">
							{toFirstUpperCase(unit.type.toLowerCase())}
						</span>
					</div>
					<p className="mt-2 text-xl font-bold tracking-tight">
						{formatAmount(
							convertPesewasToCedis(unit.rent_fee),
							unit.rent_fee_currency,
						)}
						<span className="text-muted-foreground ml-1 text-sm font-normal">
							{PER[unit.payment_frequency]}
						</span>
					</p>
				</div>
			</Card>
		</button>
	)
}
