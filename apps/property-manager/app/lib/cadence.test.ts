import { expect, test } from 'vitest'
import { cadenceForChoice, choiceForPolicy } from './cadence'

// The four cadences the API accepts. WHOLE_TERM is not one of them.
test('every month stores EVERY_PERIOD', () => {
	expect(cadenceForChoice('monthly')).toEqual({ cadence: 'EVERY_PERIOD' })
})

test('every quarter stores an explicit interval', () => {
	expect(cadenceForChoice('quarterly')).toEqual({
		cadence: 'EVERY_N_PERIODS',
		interval: 3,
	})
})

// "Whole term up front" is a collection action, not a schedule: nothing is
// issued automatically because the landlord is taking the money now.
test('whole term stores MANUAL', () => {
	expect(cadenceForChoice('whole-term')).toEqual({ cadence: 'MANUAL' })
})

test('manual stores MANUAL', () => {
	expect(cadenceForChoice('manual')).toEqual({ cadence: 'MANUAL' })
})

// A prepared account is MANUAL until the landlord chooses (case I5), and that
// is what the radio group must show.
test('a freshly prepared account reads as manual', () => {
	expect(choiceForPolicy('MANUAL', 1)).toBe('manual')
})

test('stored policies map back to their choice', () => {
	expect(choiceForPolicy('EVERY_PERIOD', 1)).toBe('monthly')
	expect(choiceForPolicy('EVERY_N_PERIODS', 3)).toBe('quarterly')
	expect(choiceForPolicy('EVERY_N_PERIODS', 1)).toBe('monthly')
})

// UPFRONT is never written by this UI, but an account may already carry it.
test('an account already on UPFRONT reads as whole term', () => {
	expect(choiceForPolicy('UPFRONT', 1)).toBe('whole-term')
})
