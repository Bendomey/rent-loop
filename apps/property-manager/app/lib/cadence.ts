export type CollectionChoice = 'whole-term' | 'quarterly' | 'monthly' | 'manual'

export interface BillingPolicy {
	cadence: RentBillingCadence
	interval?: number
}

export const COLLECTION_CHOICES: Array<{
	value: CollectionChoice
	label: string
}> = [
	{ value: 'whole-term', label: 'Whole term up front' },
	{ value: 'quarterly', label: 'Every 3 months' },
	{ value: 'monthly', label: 'Every month' },
	{ value: 'manual', label: "I'll invoice manually" },
]

/**
 * The choice the landlord made, as the API stores it.
 *
 * "Whole term up front" deliberately stores MANUAL rather than UPFRONT: it is a
 * collection action, not a schedule. The landlord is taking the money now, so
 * nothing should be issued automatically — the page selects every outstanding
 * charge in the collect section instead. UPFRONT would auto-issue one invoice,
 * which is the opposite.
 *
 * EVERY_PERIOD is used rather than EVERY_N_PERIODS with interval 1. They behave
 * identically, but the interval is load-bearing for EVERY_N_PERIODS: omit it and
 * the backend falls through to billing ALL remaining charges.
 */
export const cadenceForChoice = (choice: CollectionChoice): BillingPolicy => {
	switch (choice) {
		case 'monthly':
			return { cadence: 'EVERY_PERIOD' }
		case 'quarterly':
			return { cadence: 'EVERY_N_PERIODS', interval: 3 }
		case 'whole-term':
		case 'manual':
			return { cadence: 'MANUAL' }
	}
}

/** What the radio group shows for an account's stored policy. */
export const choiceForPolicy = (
	cadence: RentBillingCadence,
	interval: number,
): CollectionChoice => {
	if (cadence === 'UPFRONT') return 'whole-term'
	if (cadence === 'MANUAL') return 'manual'
	if (cadence === 'EVERY_PERIOD') return 'monthly'
	return interval === 1 ? 'monthly' : 'quarterly'
}
