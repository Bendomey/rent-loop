import { expect, test } from 'vitest'
import { toStringFeatures } from './features'

test('numbers and booleans become strings the form schema accepts', () => {
	expect(toStringFeatures({ 'Max Occupants': 2, Parking: true })).toEqual({
		'Max Occupants': '2',
		Parking: 'true',
	})
})

test('strings are left alone', () => {
	expect(toStringFeatures({ Security: '24/7', Balcony: 'Yes' })).toEqual({
		Security: '24/7',
		Balcony: 'Yes',
	})
})

test('missing features are an empty record', () => {
	expect(toStringFeatures(null)).toEqual({})
	expect(toStringFeatures(undefined)).toEqual({})
})

test('nullish values drop out and nested values are serialised', () => {
	expect(
		toStringFeatures({ Gym: null, Kitchen: undefined, Rooms: { beds: 2 } }),
	).toEqual({ Rooms: '{"beds":2}' })
})
