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
 * When the desired unit actually becomes free.
 *
 * A unit under notice can't take a term that starts before the sitting tenant
 * leaves — the two leases would overlap. The old step let that through and the
 * problem only surfaced at approval, so the dates are checked here instead,
 * while they are still the thing being decided.
 */
export function useUnitAvailability(
	clientId: string,
	propertyId: string,
	unitId: string,
	/** This application's own lease, once approved, must not block itself. */
	applicationId: string,
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
	if (blocking.length === 0) return { freeFrom: null, occupant: null }

	const latest = blocking.reduce((held, lease) =>
		endOf(lease) > endOf(held) ? lease : held,
	)

	return {
		freeFrom: endOf(latest),
		occupant:
			[latest.tenant?.first_name, latest.tenant?.last_name]
				.filter(Boolean)
				.join(' ') || null,
	}
}
