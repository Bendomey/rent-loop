import { expect, test } from 'vitest'
import { dayIsSaturated, firstFreeDay, termIsSaturated } from './availability'

const day = (d: number) => new Date(Date.UTC(2026, 8, d))
const range = (from: number, to: number) => ({
	start_date: `2026-09-${String(from).padStart(2, '0')}`,
	end_date: `2026-09-${String(to).padStart(2, '0')}`,
})

test('a free room disables nothing', () => {
	expect(dayIsSaturated(day(5), [])).toBe(false)
})

test('a day inside a saturated span is disabled', () => {
	expect(dayIsSaturated(day(5), [range(1, 10)])).toBe(true)
})

// Half-open, matching the server. A term may begin on the day another ends,
// which is what every back-to-back renewal does.
test('the day a span ends is free', () => {
	expect(dayIsSaturated(day(10), [range(1, 10)])).toBe(false)
})

test('the day a span starts is taken', () => {
	expect(dayIsSaturated(day(1), [range(1, 10)])).toBe(true)
})

// A room with a hole in the middle — a short booking between two free spans.
// The old hook could not represent this at all.
test('days either side of a hole stay selectable', () => {
	const ranges = [range(10, 14)]
	expect(dayIsSaturated(day(5), ranges)).toBe(false)
	expect(dayIsSaturated(day(12), ranges)).toBe(true)
	expect(dayIsSaturated(day(20), ranges)).toBe(false)
})

// The picker only disables starts. A start that is free can still produce a
// term that runs into a saturated span, and the duration step must catch it.
test('a term running into a span is refused even from a free start', () => {
	expect(termIsSaturated(day(1), day(20), [range(10, 14)])).toBe(true)
})

test('a term that clears every span passes', () => {
	expect(termIsSaturated(day(1), day(9), [range(10, 14)])).toBe(false)
})

test('a term ending exactly where a span starts passes', () => {
	expect(termIsSaturated(day(1), day(10), [range(10, 14)])).toBe(false)
})

test('the first free day is the floor when nothing blocks it', () => {
	expect(firstFreeDay(day(1), []).getTime()).toBe(day(1).getTime())
})

test('the first free day skips past a span covering the floor', () => {
	expect(firstFreeDay(day(1), [range(1, 10)]).getTime()).toBe(day(10).getTime())
})

test('the first free day skips consecutive spans', () => {
	const ranges = [range(1, 10), range(10, 15)]
	expect(firstFreeDay(day(1), ranges).getTime()).toBe(day(15).getTime())
})
