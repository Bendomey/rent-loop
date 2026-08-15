import { expect, test } from 'vitest'
import {
	capitalise,
	contractedIs,
	hasHave,
	isAre,
	pronounsFor,
	verb,
} from './pronouns'

test('a stated gender maps to its pronouns', () => {
	expect(pronounsFor('FEMALE')).toEqual({
		subject: 'she',
		object: 'her',
		possessive: 'her',
		plural: false,
	})
	expect(pronounsFor('MALE')).toEqual({
		subject: 'he',
		object: 'him',
		possessive: 'his',
		plural: false,
	})
})

// Gender is not pronouns, and the field has only two values. Anything we do
// not recognise — unset, empty, a value added later — must land somewhere that
// is never wrong about a real person.
test('anything unrecognised falls back to they/them', () => {
	expect(pronounsFor(null).subject).toBe('they')
	expect(pronounsFor(undefined).subject).toBe('they')
	expect(pronounsFor('' as never).subject).toBe('they')
	expect(pronounsFor('NONBINARY' as never).subject).toBe('they')
})

// The whole reason this is a helper. "Who they is" would ship otherwise.
test('they takes plural verbs', () => {
	const they = pronounsFor(null)
	const she = pronounsFor('FEMALE')

	expect(isAre(they)).toBe('are')
	expect(isAre(she)).toBe('is')
	expect(hasHave(they)).toBe('have')
	expect(hasHave(she)).toBe('has')
})

test('regular verbs take third-person s only in the singular', () => {
	expect(verb(pronounsFor('FEMALE'), 'move')).toBe('moves')
	expect(verb(pronounsFor('FEMALE'), 'pay')).toBe('pays')
	expect(verb(pronounsFor(null), 'move')).toBe('move')
	expect(verb(pronounsFor(null), 'pay')).toBe('pay')
})

// "she's applying" vs "they're applying"
test('contracted is follows number', () => {
	expect(contractedIs(pronounsFor('MALE'))).toBe("'s")
	expect(contractedIs(pronounsFor(null))).toBe("'re")
})

test('capitalise starts a sentence without touching the rest', () => {
	expect(capitalise('they')).toBe('They')
	expect(capitalise('')).toBe('')
})
