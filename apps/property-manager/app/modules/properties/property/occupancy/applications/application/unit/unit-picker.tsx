import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { UnavailableList } from './unavailable-list'
import { UnitCard } from './unit-card'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
	formatAmount,
} from '~/lib/format-amount'
import type { Pronouns } from '~/lib/pronouns'
import { toFirstUpperCase } from '~/lib/strings'
import { partitionUnits, unitTypesOf } from '~/lib/unit-groups'
import { cn } from '~/lib/utils'

export function UnitPicker({
	units,
	currentUnitId,
	currentRent,
	applicantName,
	pronouns,
	chargeCount,
	saving,
	onCancel,
	onConfirm,
}: {
	units: PropertyUnit[]
	currentUnitId?: string
	/** The agreed rent in pesewas, or null when none has been stated yet. */
	currentRent: Nullable<number>
	applicantName: string
	pronouns: Pronouns
	chargeCount: number
	saving: boolean
	onCancel?: () => void
	onConfirm: (unitId: string, rentMinor: Nullable<number>) => void
}) {
	const [picked, setPicked] = useState<string | undefined>(undefined)
	const [type, setType] = useState<Nullable<string>>(null)
	// Defaults to the agreed figure, so the safe outcome is also the fastest.
	const [rent, setRent] = useState(
		currentRent == null ? '' : String(convertPesewasToCedis(currentRent)),
	)

	const types = unitTypesOf(units)
	const { free, unavailable } = partitionUnits(units, { type })
	const selected = units.find((unit) => unit.id === picked)
	const changed = Boolean(picked && picked !== currentUnitId)

	const listedRent = convertPesewasToCedis(selected?.rent_fee ?? 0)
	const enteredRent = Number.parseFloat(rent.replace(/,/g, '')) || 0

	return (
		<div className="flex flex-col gap-5">
			{currentUnitId && chargeCount > 0 ? (
				<Alert>
					<AlertTriangle className="size-4" />
					<AlertTitle>Rent charges will be rebuilt</AlertTitle>
					<AlertDescription>
						The {chargeCount} charge{chargeCount === 1 ? '' : 's'} on this
						application were worked out against the current unit. Moving to
						another unit rebuilds the rent schedule from the agreed terms. Fees
						you added yourself are kept.
					</AlertDescription>
				</Alert>
			) : null}

			{types.length > 1 ? (
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-muted-foreground mr-1 text-sm">Show</span>
					<Button
						variant={type === null ? 'default' : 'outline'}
						size="sm"
						onClick={() => setType(null)}
					>
						Everything
					</Button>
					{types.map((option) => (
						<Button
							key={option}
							variant={type === option ? 'default' : 'outline'}
							size="sm"
							onClick={() => setType(type === option ? null : option)}
						>
							{toFirstUpperCase(option.toLowerCase())}
						</Button>
					))}
				</div>
			) : null}

			<div>
				<div className="mb-3 flex flex-wrap items-baseline gap-3">
					<h2 className="text-lg font-bold">Free now</h2>
					<span className="text-muted-foreground font-mono text-sm font-bold">
						{free.length}
					</span>
					<span className="text-muted-foreground text-sm">
						{applicantName} could move into any of these.
					</span>
				</div>

				{free.length > 0 ? (
					<div
						id="unit-grid"
						// Two across by default: the picker occupies 8 of the page's 12
						// columns, with "What this decides" in the other 4, so three
						// across leaves cards too narrow for a unit name and its type to
						// share a line.
						className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3"
					>
						{free.map((unit) => (
							<UnitCard
								key={unit.id}
								unit={unit}
								selected={picked === unit.id}
								current={currentUnitId === unit.id}
								onSelect={() => setPicked(unit.id)}
							/>
						))}
					</div>
				) : (
					<div className="rounded-xl border p-10 text-center">
						<p className="font-bold">
							Nothing is free {type ? 'of that type' : 'in this property'}
						</p>
						<p className="text-muted-foreground mt-2 text-sm">
							{type
								? 'Try showing everything, or check the units below.'
								: 'Every unit is taken, under maintenance, or unpublished.'}
						</p>
						{type ? (
							<Button
								variant="outline"
								size="sm"
								className="mt-4"
								onClick={() => setType(null)}
							>
								Show everything
							</Button>
						) : null}
					</div>
				)}
			</div>

			<UnavailableList units={unavailable} pronounSubject={pronouns.subject} />

			<div
				className={cn(
					'bg-background sticky bottom-0 flex flex-col gap-3',
					'rounded-xl border p-4 shadow-lg',
				)}
			>
				{/*
				 * The rent lives in the sticky bar, not above it. Only once another
				 * unit is picked, and only when a rent has been agreed — before that
				 * there is nothing to preserve and the unit's listing is the right
				 * starting point. Moved from ChangeUnitModal rather than rewritten:
				 * this is the behaviour f3 protects, and it has to be in view at the
				 * moment you confirm, not scrolled off above a long grid.
				 */}
				{currentRent != null && changed ? (
					<div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b pb-3">
						<Label htmlFor="change-unit-rent" className="shrink-0">
							Rent for this lease
						</Label>
						<span className="text-muted-foreground text-sm font-semibold">
							{selected?.rent_fee_currency ?? 'GH₵'}
						</span>
						<Input
							id="change-unit-rent"
							inputMode="decimal"
							className="w-32 font-semibold"
							value={rent}
							disabled={saving}
							onChange={(event) => setRent(event.target.value)}
						/>
						{listedRent > 0 && listedRent !== enteredRent ? (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setRent(String(listedRent))}
							>
								Use listed (
								{formatAmount(listedRent, selected?.rent_fee_currency)})
							</Button>
						) : null}
						<p className="text-muted-foreground min-w-48 flex-1 text-xs">
							Carried over from what you agreed — the rebuilt charges use this,
							not the unit&rsquo;s listing.
						</p>
					</div>
				) : null}

				<div className="flex flex-wrap items-center gap-4">
					<p className="text-muted-foreground min-w-48 flex-1 text-sm">
						{selected ? (
							<>
								You&rsquo;ve picked{' '}
								<b className="text-foreground">{selected.name}</b> —{' '}
								{formatAmount(
									convertPesewasToCedis(selected.rent_fee),
									selected.rent_fee_currency,
								)}
								.
							</>
						) : (
							'Pick a unit to carry on. You can change it later, as long as no money has come in.'
						)}
					</p>

					{onCancel ? (
						<Button variant="outline" onClick={onCancel} disabled={saving}>
							Keep the current unit
						</Button>
					) : null}

					<Button
						id="confirm-unit"
						disabled={!changed || saving}
						onClick={() =>
							picked &&
							onConfirm(
								picked,
								currentRent == null ? null : convertCedisToPesewas(enteredRent),
							)
						}
					>
						{saving ? <Spinner /> : null}
						{selected
							? `Give ${applicantName} ${selected.name}`
							: 'Pick a unit'}
					</Button>
				</div>
			</div>
		</div>
	)
}
