const FREQUENCY_LABELS: Record<
	string,
	{ singular: string; plural: string; frequency: string }
> = {
	DAILY: { singular: 'day', plural: 'days', frequency: 'Daily' },
	WEEKLY: { singular: 'week', plural: 'weeks', frequency: 'Weekly' },
	MONTHLY: { singular: 'month', plural: 'months', frequency: 'Monthly' },
	QUARTERLY: {
		singular: 'quarter',
		plural: 'quarters',
		frequency: 'Quarterly',
	},
	BIANNUALLY: {
		singular: '6-month period',
		plural: '6-month periods',
		frequency: 'Biannually',
	},
	ANNUALLY: { singular: 'year', plural: 'years', frequency: 'Annually' },
}

/** Returns the human-readable frequency label, e.g. "Monthly", "Weekly" */
export function getPaymentFrequencyLabel(frequency: string): string {
	return FREQUENCY_LABELS[frequency.toUpperCase()]?.frequency ?? frequency
}

/** Returns the period unit label, e.g. "month" (count=1) or "months" (count≠1) */
export function getPaymentFrequencyPeriodLabel(
	frequency: string,
	count = 1,
): string {
	const entry = FREQUENCY_LABELS[frequency.toUpperCase()]
	if (!entry) return count === 1 ? 'period' : 'periods'
	return count === 1 ? entry.singular : entry.plural
}

export function getPropertyUnitStatusLabel(
	propertyStatus?: PropertyUnit['status'],
) {
	switch (propertyStatus) {
		case 'Unit.Status.Available':
			return 'Available'
		case 'Unit.Status.Unavailable':
			return 'Unavailable'
		default:
			return 'Unknown'
	}
}

export function getPropertyUnitStatusColor(
	propertyStatus?: PropertyUnit['status'],
) {
	switch (propertyStatus) {
		case 'Unit.Status.Available':
			return 'bg-green-100 text-green-800'
		case 'Unit.Status.Unavailable':
			return 'bg-red-100 text-red-800'
		default:
			return 'bg-gray-100 text-gray-800'
	}
}
