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
	periods: number
	frequency: PaymentFrequency
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

/**
 * The rent schedule charges:prepare will create, computed client-side so the
 * landlord sees what they are agreeing to before it exists. Mirrors
 * internal/services/financials/materialise.go — if that changes, this must.
 */
export const buildSchedule = ({
	rent,
	moveIn,
	periods,
	frequency,
}: ScheduleInput): SchedulePeriod[] => {
	if (periods <= 0) return []
	const start = new Date(moveIn)
	const grace = GRACE_DAYS[frequency]

	return Array.from({ length: periods }, (_, n) => {
		const periodStart = advance(start, frequency, n)
		const dueDate = new Date(periodStart.getTime())
		dueDate.setUTCDate(dueDate.getUTCDate() + grace)
		return {
			name: periodLabel(periodStart, frequency),
			amount: rent,
			periodStart,
			dueDate,
		}
	})
}
