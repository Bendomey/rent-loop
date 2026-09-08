import { describe, expect, it } from 'vitest'
import {
	defaultDuration,
	durationBare,
	durationOptions,
	durationPlain,
	durationWords,
} from './renewal-term'

describe('durationWords', () => {
	it('prefers prose for the common monthly lengths', () => {
		expect(durationWords(6, 'MONTHLY')).toBe('six months')
		expect(durationWords(12, 'MONTHLY')).toBe('a year')
		expect(durationWords(24, 'MONTHLY')).toBe('two years')
	})

	it('counts anything else in its own unit', () => {
		expect(durationWords(7, 'MONTHLY')).toBe('7 months')
		expect(durationWords(1, 'MONTHLY')).toBe('1 month')
	})

	it('never calls a non-monthly term months', () => {
		expect(durationWords(6, 'DAILY')).toBe('6 days')
		expect(durationWords(12, 'DAILY')).toBe('12 days')
		expect(durationWords(2, 'WEEKLY')).toBe('2 weeks')
		expect(durationWords(1, 'ANNUALLY')).toBe('1 year')
	})

	it('drops the article for mid-sentence use', () => {
		expect(durationBare(12, 'MONTHLY')).toBe('year')
		expect(durationBare(6, 'MONTHLY')).toBe('six months')
	})
})

describe('durationPlain', () => {
	it('rolls whole years up', () => {
		expect(durationPlain(12, 'MONTHLY')).toBe('1 year')
		expect(durationPlain(24, 'MONTHLY')).toBe('2 years')
	})

	it('leaves part-years in months', () => {
		expect(durationPlain(6, 'MONTHLY')).toBe('6 months')
		expect(durationPlain(18, 'MONTHLY')).toBe('18 months')
	})

	it('does not roll up a non-monthly term', () => {
		expect(durationPlain(12, 'DAILY')).toBe('12 days')
	})
})

describe('durationOptions', () => {
	it('marks the length they are on now', () => {
		const options = durationOptions(6, 'MONTHLY')
		expect(options.find((o) => o.n === 6)?.tag).toBe('Same as now')
		expect(options.filter((o) => o.tag)).toHaveLength(1)
	})

	it('nudges towards nothing else — no other option is tagged', () => {
		expect(
			durationOptions(6, 'MONTHLY').find((o) => o.n === 12)?.tag,
		).toBeUndefined()
	})

	it('offers an unusual parent length alongside the presets', () => {
		expect(durationOptions(3, 'MONTHLY').map((o) => o.n)).toEqual([
			3, 6, 12, 24,
		])
		expect(durationOptions(18, 'MONTHLY').map((o) => o.n)).toEqual([
			6, 12, 18, 24,
		])
	})

	it('does not duplicate a parent length that is already a preset', () => {
		expect(durationOptions(12, 'MONTHLY').map((o) => o.n)).toEqual([6, 12, 24])
	})

	it('labels every option in the term unit', () => {
		expect(durationOptions(6, 'DAILY').map((o) => o.label)).toEqual([
			'6 days',
			'12 days',
			'24 days',
		])
	})

	it('ignores a missing parent length rather than offering zero', () => {
		expect(durationOptions(0, 'MONTHLY').map((o) => o.n)).toEqual([6, 12, 24])
	})
})

describe('defaultDuration', () => {
	it('carries the current length over when they stay put', () => {
		expect(defaultDuration(6, false)).toBe(6)
		expect(defaultDuration(3, false)).toBe(3)
		expect(defaultDuration(18, false)).toBe(18)
	})

	it('does not carry a length into a different room', () => {
		expect(defaultDuration(6, true)).toBe(12)
		expect(defaultDuration(18, true)).toBe(12)
	})

	it('falls back when the parent has no usable length', () => {
		expect(defaultDuration(0, false)).toBe(12)
		expect(defaultDuration(-1, false)).toBe(12)
	})

	it('never invents a longer term than the one they are on', () => {
		for (const parent of [1, 3, 6, 9, 12, 24]) {
			expect(defaultDuration(parent, false)).toBeLessThanOrEqual(parent)
		}
	})
})
