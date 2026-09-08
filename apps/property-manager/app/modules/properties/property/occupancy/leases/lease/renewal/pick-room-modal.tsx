import { Check, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { formatAmount, convertPesewasToCedis } from '~/lib/format-amount'
import { isPickable, unitAvailability } from '~/lib/unit-groups'
import { cn } from '~/lib/utils'

const money = (minor: number, currency: string) =>
	formatAmount(convertPesewasToCedis(minor), currency)

/** Past this many rooms, scanning the list stops being quicker than typing. */
const SEARCH_THRESHOLD = 8

/**
 * Which room a tenant moves into.
 *
 * A dialog rather than an inline grid: a property can hold dozens of rooms, and
 * unrolling them under the question buried the rest of the step and squeezed
 * the names — which are codes like ADV-PRO-A-U010 — into a column too narrow to
 * hold them on one line.
 *
 * Rooms someone already lives in are listed, not hidden. The sitting tenant may
 * be leaving before the new term starts, so the status is stated and the choice
 * is left to the landlord; the term step is what refuses an actual date clash.
 */
export function PickRoomModal({
	open,
	onOpenChange,
	units,
	currentUnitId,
	selectedUnitId,
	currency,
	onPick,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	units: PropertyUnit[]
	currentUnitId: string
	selectedUnitId: string
	currency: string
	onPick: (unit: PropertyUnit) => void
}) {
	const [query, setQuery] = useState('')

	const options = useMemo(() => {
		const others = units.filter((unit) => unit.id !== currentUnitId)
		// Free rooms first — the ones that need no further thought.
		return [...others].sort(
			(a, b) => Number(isPickable(b.status)) - Number(isPickable(a.status)),
		)
	}, [units, currentUnitId])

	const needle = query.trim().toLowerCase()
	const shown = needle
		? options.filter((unit) => unit.name.toLowerCase().includes(needle))
		: options

	const close = (next: boolean) => {
		if (!next) setQuery('')
		onOpenChange(next)
	}

	return (
		<Dialog open={open} onOpenChange={close}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Move them to another room</DialogTitle>
					<DialogDescription>
						Their balance and deposit come with them. Only the room changes.
					</DialogDescription>
				</DialogHeader>

				{options.length > SEARCH_THRESHOLD && (
					<div className="relative">
						<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Find a room"
							className="pl-9"
						/>
					</div>
				)}

				<div className="max-h-[52vh] overflow-y-auto rounded-xl border">
					{shown.length === 0 ? (
						<p className="text-muted-foreground px-4 py-10 text-center text-sm">
							No room here matches “{query}”.
						</p>
					) : (
						<ul className="divide-y">
							{shown.map((unit) => {
								const availability = unitAvailability(unit.status)
								const on = unit.id === selectedUnitId
								return (
									<li key={unit.id}>
										<button
											type="button"
											onClick={() => {
												onPick(unit)
												close(false)
											}}
											className={cn(
												'hover:bg-muted/60 flex w-full items-center gap-3 px-4 py-3 text-left',
												on && 'bg-primary/8',
											)}
										>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-[15px] font-semibold">
													{unit.name}
												</span>
												<span className="text-muted-foreground mt-0.5 block text-[12.5px]">
													Listed at {money(unit.rent_fee, currency)}
												</span>
											</span>
											<span
												className={cn(
													'shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold',
													availability.tone === 'success'
														? 'bg-success-bg text-success'
														: 'bg-warning-bg text-warning',
												)}
											>
												{availability.label}
											</span>
											{on && <Check className="text-primary size-4 shrink-0" />}
										</button>
									</li>
								)
							})}
						</ul>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => close(false)}>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
