import { describe, expect, test } from 'vitest'
import { localizedDayjs } from './date'
import {
	EXPIRING_STATUS_FILTER,
	expiringWindowMs,
	getLeaseDisplayStatus,
	leaseExpiringInDays,
	leaseStatusFilters,
} from './lease.utils'

const HOUR = 3_600_000
const DAY = 24 * HOUR

/** A lease `stayDays` long whose move-out is `hoursLeft` hours from now. */
const lease = (
	status: Lease['status'],
	stayDays: number,
	hoursLeft: number,
) => {
	const moveOut = localizedDayjs().add(hoursLeft, 'hour')
	return {
		status,
		move_in_date: moveOut.subtract(stayDays, 'day').toDate(),
		move_out_date: moveOut.toDate(),
	}
}

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

describe('expiringWindowMs', () => {
	test.each([
		[3, 1],
		[6, 1],
		[7, 3],
		[20, 3],
		[30, 7],
		[89, 7],
		[90, 30],
		[365, 30],
	])('a %i-day stay warns %i days out', (stayDays, windowDays) => {
		expect(expiringWindowMs(lease('Lease.Status.Active', stayDays, 0))).toBe(
			windowDays * DAY,
		)
	})

	test('a lease with no move-in falls back to the longest window', () => {
		expect(
			expiringWindowMs({
				move_in_date: null as never,
				move_out_date: new Date(),
			}),
		).toBe(30 * DAY)
	})
})

describe('getLeaseDisplayStatus', () => {
	const label = (value: ReturnType<typeof lease>) =>
		getLeaseDisplayStatus(value).label

	test('a three-day stay with 30 hours left is not yet Expiring', () => {
		expect(label(lease('Lease.Status.Active', 3, 30))).toBe('Active')
	})

	test('a three-day stay inside its last day is Expiring', () => {
		expect(label(lease('Lease.Status.Active', 3, 20))).toBe('Expiring')
	})

	test('a one-month lease is not Expiring for most of its term', () => {
		expect(label(lease('Lease.Status.Active', 31, 20 * 24))).toBe('Active')
	})

	test('a one-month lease in its last week is Expiring', () => {
		expect(label(lease('Lease.Status.Active', 31, 5 * 24))).toBe('Expiring')
	})

	test('a year-long lease twenty days out is Expiring', () => {
		expect(label(lease('Lease.Status.Active', 365, 20 * 24))).toBe('Expiring')
	})

	test('an active lease reads Ended as soon as its move-out passes', () => {
		expect(label(lease('Lease.Status.Active', 365, -2))).toBe('Ended')
	})

	test('a lease not yet started stays Pending near its end', () => {
		expect(label(lease('Lease.Status.Pending', 3, 12))).toBe('Pending')
	})

	// Pending past its dates would read as "about to start" for a term that
	// is already over.
	test('a lease never started has Ended once its dates pass', () => {
		expect(label(lease('Lease.Status.Pending', 3, -72))).toBe('Ended')
	})
})

describe('leaseExpiringInDays', () => {
	test('counts the whole days left inside the window', () => {
		expect(
			leaseExpiringInDays(lease('Lease.Status.Active', 365, 20 * 24 + 2)),
		).toBe(20)
	})

	test('is null outside the window', () => {
		expect(
			leaseExpiringInDays(lease('Lease.Status.Active', 31, 20 * 24)),
		).toBeNull()
	})

	test('is null for a lease not yet started', () => {
		expect(leaseExpiringInDays(lease('Lease.Status.Pending', 3, 12))).toBeNull()
	})
})
