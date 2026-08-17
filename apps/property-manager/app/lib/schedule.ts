export type PaymentFrequency =
	| 'DAILY'
	| 'WEEKLY'
	| 'MONTHLY'
	| 'QUARTERLY'
	| 'BIANNUALLY'
	| 'ANNUALLY'

export interface SchedulePeriod {
	name: string
	amount: number
	periodStart: Date
	dueDate: Date
}

export interface ScheduleInput {
	rent: number
	moveIn: string | Date
	/** How long the tenant is staying, in stayFrequency units. */
	stayDuration: number
	/** The unit the term is expressed in — not necessarily how rent is billed. */
	stayFrequency: PaymentFrequency
	/** How often rent falls due. May differ from stayFrequency. */
	paymentFrequency: PaymentFrequency
}

// Payment grace AFTER the period starts. Mirrors lib.RentInvoiceGracePeriod.
// Not to be confused with auto_issue_days_before, which is issuance lead time
// BEFORE the due date.
const GRACE_DAYS: Record<PaymentFrequency, number> = {
	DAILY: 0,
	WEEKLY: 3,
	MONTHLY: 7,
	QUARTERLY: 14,
	BIANNUALLY: 14,
	ANNUALLY: 30,
}

const STEP: Record<PaymentFrequency, { months?: number; days?: number }> = {
	DAILY: { days: 1 },
	WEEKLY: { days: 7 },
	MONTHLY: { months: 1 },
	QUARTERLY: { months: 3 },
	BIANNUALLY: { months: 6 },
	ANNUALLY: { months: 12 },
}

export const graceDays = (frequency: PaymentFrequency) => GRACE_DAYS[frequency]

const advance = (from: Date, frequency: PaymentFrequency, n: number) => {
	const next = new Date(from.getTime())
	const step = STEP[frequency]
	if (step.months) next.setUTCMonth(next.getUTCMonth() + step.months * n)
	else next.setUTCDate(next.getUTCDate() + (step.days ?? 0) * n)
	return next
}

export const periodLabel = (date: Date, frequency: PaymentFrequency) => {
	const month = date.toLocaleString('en-GB', {
		month: 'long',
		timeZone: 'UTC',
	})
	if (frequency === 'ANNUALLY') return `Rent – ${date.getUTCFullYear()}`
	return `Rent – ${month} ${date.getUTCFullYear()}`
}

/** Mirrors termEndDate in materialise.go. */
export const termEndDate = (
	moveIn: Date,
	stayDuration: number,
	stayFrequency: PaymentFrequency,
) => advance(moveIn, stayFrequency, stayDuration)

// The backend caps materialisation to guard against a sentinel end date.
const MAX_PERIODS = 120

/**
 * The rent schedule charges:prepare will create, computed client-side so the
 * landlord sees what they are agreeing to before it exists.
 *
 * Mirrors internal/services/financials/materialise.go — if that changes, this
 * must. Note the two frequencies are independent: the TERM is stayDuration in
 * stayFrequency units, and rent falls due every paymentFrequency within it. A
 * twelve-month stay billed quarterly is four charges, not twelve — deriving the
 * count from stayDuration alone would treble the total shown to the landlord.
 */
export const buildSchedule = ({
	rent,
	moveIn,
	stayDuration,
	stayFrequency,
	paymentFrequency,
}: ScheduleInput): SchedulePeriod[] => {
	if (stayDuration <= 0) return []

	const start = new Date(moveIn)
	const end = termEndDate(start, stayDuration, stayFrequency)
	const grace = GRACE_DAYS[paymentFrequency]

	const periods: SchedulePeriod[] = []
	for (let n = 0; n < MAX_PERIODS; n += 1) {
		const periodStart = advance(start, paymentFrequency, n)
		if (periodStart >= end) break
		const dueDate = new Date(periodStart.getTime())
		dueDate.setUTCDate(dueDate.getUTCDate() + grace)
		periods.push({
			name: periodLabel(periodStart, paymentFrequency),
			amount: rent,
			periodStart,
			dueDate,
		})
	}
	return periods
}
