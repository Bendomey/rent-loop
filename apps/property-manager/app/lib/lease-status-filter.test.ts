import { describe, expect, test } from 'vitest'
import { localizedDayjs } from './date'
import {
	EXPIRING_STATUS_FILTER,
	expiringWindowDays,
	getLeaseDisplayStatus,
	leaseStatusFilters,
} from './lease.utils'

describe('leaseStatusFilters', () => {
	test('no status means no status or expiring constraint', () => {
		expect(leaseStatusFilters(undefined)).toEqual({})
	})

	test('Expiring asks for active leases inside their window', () => {
		expect(leaseStatusFilters(EXPIRING_STATUS_FILTER)).toEqual({
			status: 'Lease.Status.Active',
			expiring: true,
		})
	})

	test('Active leaves out the leases the table badges Expiring or Ended', () => {
		expect(leaseStatusFilters('Lease.Status.Active')).toEqual({
			status: 'Lease.Status.Active',
			expiring: false,
		})
	})

	test('other statuses pass straight through', () => {
		expect(leaseStatusFilters('Lease.Status.Terminated')).toEqual({
			status: 'Lease.Status.Terminated',
		})
	})
})

describe('expiringWindowDays', () => {
	test.each([
		['HOURLY', 0],
		['hours', 0],
		['DAILY', 1],
		['days', 1],
		['WEEKLY', 3],
		['MONTHLY', 30],
		['months', 30],
		['ANNUALLY', 30],
		[null, 30],
	])('%s stays warn %i days out', (unit, days) => {
		expect(expiringWindowDays(unit)).toBe(days)
	})
})

describe('getLeaseDisplayStatus', () => {
	const ending = (hours: number) => localizedDayjs().add(hours, 'hour').toDate()
	const label = (lease: Parameters<typeof getLeaseDisplayStatus>[0]) =>
		getLeaseDisplayStatus(lease).label

	test('a daily stay three days from its end is not yet Expiring', () => {
		expect(
			label({
				status: 'Lease.Status.Active',
				stay_duration_frequency: 'DAILY',
				move_out_date: ending(72 + 2),
			}),
		).toBe('Active')
	})

	test('a daily stay ending tomorrow is Expiring', () => {
		expect(
			label({
				status: 'Lease.Status.Active',
				stay_duration_frequency: 'DAILY',
				move_out_date: ending(30),
			}),
		).toBe('Expiring')
	})

	test('a weekly stay five days out is not yet Expiring', () => {
		expect(
			label({
				status: 'Lease.Status.Active',
				stay_duration_frequency: 'WEEKLY',
				move_out_date: ending(5 * 24 + 2),
			}),
		).toBe('Active')
	})

	test('a monthly lease twenty days out is Expiring', () => {
		expect(
			label({
				status: 'Lease.Status.Active',
				stay_duration_frequency: 'MONTHLY',
				move_out_date: ending(20 * 24),
			}),
		).toBe('Expiring')
	})

	test('an active lease past its move-out has Ended', () => {
		expect(
			label({
				status: 'Lease.Status.Active',
				stay_duration_frequency: 'MONTHLY',
				move_out_date: ending(-72),
			}),
		).toBe('Ended')
	})

	test('a lease not yet started stays Pending near its end', () => {
		expect(
			label({
				status: 'Lease.Status.Pending',
				stay_duration_frequency: 'DAILY',
				move_out_date: ending(12),
			}),
		).toBe('Pending')
	})

	// Pending past its dates would read as "about to start" for a term that
	// is already over.
	test('a lease never started has Ended once its dates pass', () => {
		expect(
			label({
				status: 'Lease.Status.Pending',
				stay_duration_frequency: 'DAILY',
				move_out_date: ending(-72),
			}),
		).toBe('Ended')
	})
})
