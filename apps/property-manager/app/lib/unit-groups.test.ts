import { expect, test } from 'vitest'
import {
	isPickable,
	partitionUnits,
	unavailableReason,
	unitAvailability,
	unitTypesOf,
} from './unit-groups'

const unit = (
	id: string,
	status: PropertyUnit['status'],
	type: PropertyUnit['type'] = 'APARTMENT',
) => ({ id, status, type, name: id }) as PropertyUnit

// A unit whose max_occupants_allowed exceeds its live lease count is
// PartiallyOccupied: it has room, and the service says so. Treating it as
// unavailable is the bug f4 exists to catch.
test('available and partially occupied units are pickable', () => {
	expect(isPickable('Unit.Status.Available')).toBe(true)
	expect(isPickable('Unit.Status.PartiallyOccupied')).toBe(true)
})

test('everything else is not', () => {
	expect(isPickable('Unit.Status.Occupied')).toBe(false)
	expect(isPickable('Unit.Status.Maintenance')).toBe(false)
	expect(isPickable('Unit.Status.Draft')).toBe(false)
})

test('each unavailable status says why in plain words', () => {
	expect(unavailableReason('Unit.Status.Occupied')).toBe('Someone lives here')
	expect(unavailableReason('Unit.Status.Maintenance')).toBe('Under maintenance')
	expect(unavailableReason('Unit.Status.Draft')).toBe('Not published yet')
})

test('units split into the two groups', () => {
	const { free, unavailable } = partitionUnits([
		unit('a', 'Unit.Status.Available'),
		unit('b', 'Unit.Status.Occupied'),
		unit('c', 'Unit.Status.PartiallyOccupied'),
		unit('d', 'Unit.Status.Maintenance'),
	])

	expect(free.map((u) => u.id)).toEqual(['a', 'c'])
	expect(unavailable.map((u) => u.id)).toEqual(['b', 'd'])
})

// The filter narrows what is on offer; it must never quietly hide a unit from
// the "can't take" count, or the numbers stop reconciling with the property.
test('the type filter applies to both groups', () => {
	const units = [
		unit('a', 'Unit.Status.Available', 'APARTMENT'),
		unit('b', 'Unit.Status.Available', 'STUDIO'),
		unit('c', 'Unit.Status.Occupied', 'APARTMENT'),
		unit('d', 'Unit.Status.Occupied', 'STUDIO'),
	]

	const { free, unavailable } = partitionUnits(units, { type: 'STUDIO' })
	expect(free.map((u) => u.id)).toEqual(['b'])
	expect(unavailable.map((u) => u.id)).toEqual(['d'])
})

test('no filter means everything', () => {
	const units = [
		unit('a', 'Unit.Status.Available', 'APARTMENT'),
		unit('b', 'Unit.Status.Available', 'STUDIO'),
	]
	expect(partitionUnits(units, { type: null }).free).toHaveLength(2)
})

// The chips only earn their space when there is a choice to make.
test('types are listed once, in order of first appearance', () => {
	expect(
		unitTypesOf([
			unit('a', 'Unit.Status.Available', 'STUDIO'),
			unit('b', 'Unit.Status.Available', 'APARTMENT'),
			unit('c', 'Unit.Status.Occupied', 'STUDIO'),
		]),
	).toEqual(['STUDIO', 'APARTMENT'])
})

test('a single-type property offers no types to choose between', () => {
	expect(
		unitTypesOf([
			unit('a', 'Unit.Status.Available', 'STUDIO'),
			unit('b', 'Unit.Status.Occupied', 'STUDIO'),
		]),
	).toEqual(['STUDIO'])
})

test('a free room reads as free', () => {
	expect(unitAvailability('Unit.Status.Available')).toEqual({
		label: 'Free',
		tone: 'success',
	})
})

test('a shared room says it still has space', () => {
	expect(unitAvailability('Unit.Status.PartiallyOccupied')).toEqual({
		label: 'Space for another',
		tone: 'success',
	})
})

// Warned about, never hidden: the sitting tenant may be leaving before the new
// term starts, so an occupied room stays a legitimate choice.
test('a taken room is warned about in the landlord’s words', () => {
	expect(unitAvailability('Unit.Status.Occupied')).toEqual({
		label: 'Someone lives here',
		tone: 'warning',
	})
	expect(unitAvailability('Unit.Status.Maintenance')).toEqual({
		label: 'Under maintenance',
		tone: 'warning',
	})
})

test('the chip agrees with isPickable on which rooms read as free', () => {
	const statuses = [
		'Unit.Status.Available',
		'Unit.Status.PartiallyOccupied',
		'Unit.Status.Occupied',
		'Unit.Status.Maintenance',
		'Unit.Status.Draft',
	] as const
	for (const status of statuses) {
		expect(unitAvailability(status).tone === 'success').toBe(isPickable(status))
	}
})

test('an unknown status still says something', () => {
	expect(unitAvailability('Unit.Status.Something' as never).label).toBe(
		'Not available',
	)
})
