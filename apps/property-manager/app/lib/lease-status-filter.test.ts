import { expect, test } from 'vitest'
import { localizedDayjs } from './date'
import { EXPIRING_STATUS_FILTER, leaseStatusFilters } from './lease.utils'

const today = localizedDayjs('2026-10-21')

test('no status means no status or move-out constraint', () => {
	expect(leaseStatusFilters(undefined, today)).toEqual({})
})

// The table badges a lease Expiring while its move-out is 0–30 whole days away.
// Stored move-outs are midnight, so that is every move-out from today through
// today + 31.
test('Expiring asks for active leases moving out in the expiring window', () => {
	expect(leaseStatusFilters(EXPIRING_STATUS_FILTER, today)).toEqual({
		status: 'Lease.Status.Active',
		move_out_date_from: '2026-10-21',
		move_out_date_to: '2026-11-21',
	})
})

test('Active leaves out the leases the table badges Expiring or Ended', () => {
	expect(leaseStatusFilters('Lease.Status.Active', today)).toEqual({
		status: 'Lease.Status.Active',
		move_out_date_from: '2026-11-22',
	})
})

test('other statuses pass straight through', () => {
	expect(leaseStatusFilters('Lease.Status.Terminated', today)).toEqual({
		status: 'Lease.Status.Terminated',
	})
})
