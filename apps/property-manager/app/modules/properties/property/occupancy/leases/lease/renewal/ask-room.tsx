import { Home, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Question } from './parts'
import { PickRoomModal } from './pick-room-modal'
import { useGetPropertyUnits } from '~/api/units'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

/**
 * Which room the new term is written against.
 *
 * Renewals stay put, so the current room is shown as the answer already given
 * and the alternatives open only on request.
 *
 * A move used to ask whether the money followed. It no longer does: the
 * tenant's balance and deposit always carry to the new room, so there is
 * nothing here for the PM to decide.
 */
export function AskRoom({
	clientId,
	propertyId,
	currentUnitId,
	currentUnitName,
	unitId,
	onUnitChange,
	currency,
	parentEnd,
	onRentSuggestion,
}: {
	clientId: string
	propertyId: string
	currentUnitId: string
	currentUnitName: string
	unitId: string
	onUnitChange: (next: string) => void
	currency: string
	parentEnd: Nullable<Date>
	/** A different room comes with its own listed rent. */
	onRentSuggestion: (rentMinor: number) => void
}) {
	const [picking, setPicking] = useState(false)
	const changed = unitId !== currentUnitId

	const { data: unitPage } = useGetPropertyUnits(clientId, {
		property_id: propertyId,
		pagination: { page: 1, per: 100 },
		sorter: {},
		search: {},
		filters: {},
	})
	const units = unitPage?.rows ?? []
	const picked = units.find((unit) => unit.id === unitId)

	return (
		<>
			<Question
				q="Which room are they taking?"
				done={!!unitId}
				help="Renewals usually stay put, so the room is already set. Open the list only if they are moving to another room in this property."
				foot={
					changed && parentEnd
						? `They leave ${currentUnitName} on ${parentEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })} and take ${picked?.name ?? 'the new room'} from the new term.`
						: undefined
				}
			>
				<div
					className={cn(
						'flex flex-wrap items-center gap-4 rounded-[14px] border-[1.5px] px-5 py-4',
						changed ? 'border-primary bg-primary/8' : 'bg-card',
					)}
				>
					<span className="bg-muted flex size-[46px] shrink-0 items-center justify-center rounded-[13px]">
						<Home className="size-[22px]" />
					</span>
					<div className="min-w-0 flex-1">
						<p className="text-[19px] font-bold tracking-[-0.3px]">
							{picked?.name ?? currentUnitName}
						</p>
						<p className="text-muted-foreground mt-1 text-sm">
							{changed
								? `A move — they are in ${currentUnitName} until the current term ends`
								: 'The room they are in now'}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{changed && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => onUnitChange(currentUnitId)}
							>
								Keep them in {currentUnitName}
							</Button>
						)}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setPicking(true)}
						>
							<RefreshCw className="size-4" />
							{changed ? 'Pick a different room' : 'Move them to another room'}
						</Button>
					</div>
				</div>
			</Question>

			<PickRoomModal
				open={picking}
				onOpenChange={setPicking}
				units={units}
				currentUnitId={currentUnitId}
				selectedUnitId={unitId}
				currency={currency}
				onPick={(unit) => {
					onUnitChange(unit.id)
					onRentSuggestion(unit.rent_fee)
				}}
			/>
		</>
	)
}
