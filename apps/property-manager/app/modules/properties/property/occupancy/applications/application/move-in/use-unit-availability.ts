import { useGetPropertyLeases } from '~/api/leases'
import type { PaymentFrequency } from '~/lib/schedule'
import { termEndDate } from '~/lib/schedule'

const BLOCKING = ['Lease.Status.Active', 'Lease.Status.Pending']

const endOf = (lease: Lease) => {
	if (lease.move_out_date) return new Date(lease.move_out_date)
	return termEndDate(
		new Date(lease.move_in_date),
		lease.stay_duration,
		lease.stay_duration_frequency as PaymentFrequency,
	)
}

/**
 * When the desired unit actually has room for another term.
 *
 * A full unit can't take a term that starts before a sitting tenant leaves —
 * the leases would overlap. The old step let that through and the problem only
 * surfaced at approval, so the dates are checked here instead, while they are
 * still the thing being decided.
 *
 * Capacity is the whole question. A unit holding fewer live leases than
 * `max_occupants_allowed` has a spare bed and is free now, which is what the
 * service means by PartiallyOccupied. Counting leases without consulting
 * capacity declared every shared unit occupied until its first tenant left.
 *
 * And when a unit *is* full, the slot opens as soon as enough leases end — for
 * a full two-bed unit that is the earliest-ending lease, not the latest. Using
 * the latest overstated the wait by however long the longer tenancy runs.
 */
export function useUnitAvailability(
	clientId: string,
	propertyId: string,
	unitId: string,
	/** This application's own lease, once approved, must not block itself. */
	applicationId: string,
	/** The unit's `max_occupants_allowed`. Defaults to a single occupant. */
	capacity = 1,
) {
	const { data } = useGetPropertyLeases(clientId, propertyId, {
		pagination: { page: 1, per: 20 },
		sorter: {},
		search: {},
		filters: { unit_ids: [unitId] },
	})

	const blocking = (data?.rows ?? []).filter(
		(lease) =>
			lease.tenant_application_id !== applicationId &&
			BLOCKING.includes(lease.status),
	)
	// How many tenancies must end before a bed frees up. At or below zero the
	// unit already has room.
	const slotsNeeded = blocking.length - Math.max(1, capacity) + 1
	if (slotsNeeded <= 0) return { freeFrom: null, occupant: null }

	// The Nth earliest ending lease is the one that frees the slot.
	const byEnd = [...blocking].sort(
		(a, b) => endOf(a).getTime() - endOf(b).getTime(),
	)
	const frees = byEnd[slotsNeeded - 1]
	if (!frees) return { freeFrom: null, occupant: null }

	return {
		freeFrom: endOf(frees),
		occupant:
			[frees.tenant?.first_name, frees.tenant?.last_name]
				.filter(Boolean)
				.join(' ') || null,
	}
}
