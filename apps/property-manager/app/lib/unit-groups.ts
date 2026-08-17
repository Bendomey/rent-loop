/**
 * Which units an application can actually be moved to, and why the rest can't.
 *
 * Two groups, not three. An earlier draft had a "Free soon" group derived from
 * the sitting tenants' lease end dates; that was cut, so a capacity clash
 * surfaces at the move-in step through `useUnitAvailability` instead — which is
 * where the date being clashed with is actually chosen.
 */

/**
 * `PartiallyOccupied` means the unit holds fewer live leases than its
 * `max_occupants_allowed`: it has a spare bed, and the service will accept
 * another application for it. Excluding it declared every shared unit full
 * until its first tenant left.
 */
export const isPickable = (status: PropertyUnit['status']) =>
	status === 'Unit.Status.Available' ||
	status === 'Unit.Status.PartiallyOccupied'

const REASONS: Record<string, string> = {
	'Unit.Status.Occupied': 'Someone lives here',
	'Unit.Status.Maintenance': 'Under maintenance',
	'Unit.Status.Draft': 'Not published yet',
}

/** Why a unit is out, in the landlord's words rather than the model's. */
export const unavailableReason = (status: PropertyUnit['status']) =>
	REASONS[status] ?? 'Not available'

export interface UnitPartition {
	free: PropertyUnit[]
	unavailable: PropertyUnit[]
}

/**
 * The filter applies to both groups on purpose. Narrowing only the offered
 * units would leave the "can't take" count describing the whole property while
 * the grid above described one type of it.
 */
export function partitionUnits(
	units: PropertyUnit[],
	opts: { type?: Nullable<string> } = {},
): UnitPartition {
	const matching = opts.type
		? units.filter((unit) => unit.type === opts.type)
		: units

	return {
		free: matching.filter((unit) => isPickable(unit.status)),
		unavailable: matching.filter((unit) => !isPickable(unit.status)),
	}
}

/** Distinct types, in order of first appearance. */
export const unitTypesOf = (units: PropertyUnit[]) => [
	...new Set(units.map((unit) => unit.type)),
]
