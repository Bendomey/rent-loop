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

export function getPropertyStatusLabel(propertyStatus: Property['status']) {
	switch (propertyStatus) {
		case 'Property.Status.Active':
			return 'Active'
		case 'Property.Status.Inactive':
			return 'Inactive'
		case 'Property.Status.Maintenance':
			return 'Maintenance'
		default:
			return 'Unknown'
	}
}

export function getPropertyTypeLabel(propertyType: Property['type']) {
	switch (propertyType) {
		case 'SINGLE':
			return 'Single Unit'
		case 'MULTI':
			return 'Multi-Unit'
		default:
			return 'Unknown'
	}
}

export function getPropertyUnitStatusLabel(
	propertyStatus: PropertyUnit['status'],
) {
	switch (propertyStatus) {
		case 'Unit.Status.Draft':
			return 'Draft'
		case 'Unit.Status.Available':
			return 'Available'
		case 'Unit.Status.Occupied':
			return 'Occupied'
		case 'Unit.Status.Maintenance':
			return 'Maintenance'
		default:
			return 'Unknown'
	}
}
