import { Home, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Question, RadioCard } from './parts'
import { useGetPropertyUnits } from '~/api/units'
import { Button } from '~/components/ui/button'
import { formatAmount } from '~/lib/format-amount'
import { cn } from '~/lib/utils'

const money = (minor: number, currency: string) =>
	formatAmount(minor / 100, currency)

/**
 * Which room the new term is written against.
 *
 * Renewals stay put, so the current room is shown as the answer already given
 * and the alternatives open only on request. Moving rooms is the one case that
 * needs the money question, which is why the two live together.
 */
export function AskRoom({
	clientId,
	propertyId,
	currentUnitId,
	currentUnitName,
	unitId,
	onUnitChange,
	carry,
	onCarryChange,
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
	carry: boolean
	onCarryChange: (next: boolean) => void
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
					{changed ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								onUnitChange(currentUnitId)
								setPicking(false)
							}}
						>
							<RefreshCw className="size-4" />
							Keep them in {currentUnitName}
						</Button>
					) : (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setPicking(!picking)}
						>
							<RefreshCw className="size-4" />
							{picking ? 'Never mind' : 'Move them to another room'}
						</Button>
					)}
				</div>

				{picking && !changed && (
					<div className="mt-4">
						<p className="text-muted-foreground mb-3 text-[14.5px]">
							Rooms they could take instead:
						</p>
						<div className="grid gap-3 sm:grid-cols-2">
							{units
								.filter((unit) => unit.id !== currentUnitId)
								.map((unit) => (
									<RadioCard
										key={unit.id}
										label={unit.name}
										sub={`Listed at ${money(unit.rent_fee, currency)}`}
										onClick={() => {
											onUnitChange(unit.id)
											onRentSuggestion(unit.rent_fee)
											setPicking(false)
										}}
									/>
								))}
						</div>
					</div>
				)}
			</Question>

			{changed && (
				<Question
					q="What happens to their money?"
					done
					help={
						<>
							They are changing room, so their running balance and deposit can
							follow them, or the books on {currentUnitName} can be closed and
							the new room started clean.
						</>
					}
				>
					<div className="grid gap-3 sm:grid-cols-2">
						<RadioCard
							on={carry}
							onClick={() => onCarryChange(true)}
							label="Keep their existing balance and deposit"
							sub="The deposit and anything owed follow them to the new room"
							right={
								<span className="bg-success-bg text-success rounded-[20px] px-[9px] py-[3px] text-[11px] font-bold whitespace-nowrap">
									Usual
								</span>
							}
						/>
						<RadioCard
							on={!carry}
							onClick={() => onCarryChange(false)}
							label="Start a fresh balance for the new room"
							sub={`The new room starts at zero — ${currentUnitName} is settled separately, deposit included`}
						/>
					</div>
				</Question>
			)}
		</>
	)
}
