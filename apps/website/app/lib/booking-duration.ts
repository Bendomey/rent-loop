import { differenceInDays } from 'date-fns'

export const UNIT_SINGULAR: Record<PropertyUnit['payment_frequency'], string> =
	{
		DAILY: 'night',
		WEEKLY: 'week',
		MONTHLY: 'month',
		QUARTERLY: 'quarter',
		BIANNUALLY: 'period',
		ANNUALLY: 'year',
	}

export const UNIT_PLURAL: Record<PropertyUnit['payment_frequency'], string> = {
	DAILY: 'nights',
	WEEKLY: 'weeks',
	MONTHLY: 'months',
	QUARTERLY: 'quarters',
	BIANNUALLY: 'periods',
	ANNUALLY: 'years',
}

export function calcUnits(
	frequency: PropertyUnit['payment_frequency'],
	from: Date,
	to: Date,
): number {
	const days = differenceInDays(to, from)
	const months =
		(to.getFullYear() - from.getFullYear()) * 12 +
		to.getMonth() -
		from.getMonth() +
		1
	switch (frequency) {
		case 'DAILY':
			return Math.max(1, days)
		case 'WEEKLY':
			return Math.max(1, Math.round(days / 7))
		case 'MONTHLY':
			return Math.max(1, months)
		case 'QUARTERLY':
			return Math.max(1, Math.round(months / 3))
		case 'BIANNUALLY':
			return Math.max(1, Math.round(months / 6))
		case 'ANNUALLY':
			return Math.max(1, Math.round(months / 12))
	}
}
