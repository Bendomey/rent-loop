# Application Financial Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tenant application's financial setup page with one driven by the FinancialAccount model — agreed rent, a charge ledger, a collection plan, and payment collection.

**Architecture:** Four stacked sections whose visibility is driven by two facts: whether move-in setup is complete, and whether `tenantApplication.financial_account` exists. Pure computation (schedule preview, cadence mapping, display status) lives in `app/lib` with vitest coverage; everything touching the network goes through a new `app/api/financial-accounts` layer following the existing `app/api/invoices` pattern.

**Tech Stack:** React Router v7, React 19, TypeScript, TanStack Query v5, Tailwind CSS v4, Shadcn/Radix. Vitest added for `app/lib` only.

**Spec:** `docs/superpowers/specs/2026-08-06-application-financial-setup-design.md`
**Design:** Claude Design project `13798c88-670a-47eb-8971-c9214b792c26`, file `Application Financial Setup.html` (17 boards). Component sources: `rl-fin-web.jsx`, `rl-fin-sections.jsx`, `rl-fin-parts.jsx`, `rl-fin-data.jsx`.
**Backend behaviour:** verified by `services/main/scripts/e2e/` (39 scenarios). Case IDs cited below refer to those.

## Global Constraints

- **Never run `git commit`.** `CLAUDE.md` forbids it. This overrides the writing-plans skill's usual commit step. Every task ends with changes left unstaged.
- **Amounts are minor units** (pesewas). GH₵ 1,000 is `100000`. Use `convertPesewasToCedis` / `convertCedisToPesewas` / `formatAmount` from `~/lib/format-amount` — never divide by 100 inline.
- **Dark mode is mandatory.** `apps/property-manager/CLAUDE.md`: every change must work in both themes. **The design file is light-mode only** — it hardcodes `LB.ink`, `LB.cream`, `#fff`, `rgba(17,17,16,…)`. Do not copy those values. Map them onto the existing Shadcn CSS variables: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border`, `bg-muted`. Crimson is the existing primary. Verify every board in both modes.
- **Use Shadcn primitives** from `~/components/ui` rather than the design's hand-rolled `FMoney` / `FSelect` / `FCheck`. The design defines behaviour and layout; the component kit is ours.
- **`safeString()`** from `~/lib/strings` instead of `?? ''`.
- **`void` operator** on unhandled promises (`void navigate(...)`) — the lint rule is an error.
- **Cards** take `className="shadow-none"`.
- **Swagger is the API source of truth**: https://api.rentloopapp.com/swagger/index.html
- **Verification per task:** `yarn types:check` and `yarn lint` must pass. Tasks 1–2 additionally run `yarn test`.

## File Structure

| File | Responsibility |
|---|---|
| `vitest.config.ts` | Test runner, scoped to `app/lib` |
| `app/lib/schedule.ts` | Pure schedule preview — mirrors `materialise.go` |
| `app/lib/cadence.ts` | Collection choice ⇄ `{cadence, interval}` |
| `app/lib/display-status.ts` | `chargeDisplayStatus`, `invoiceDisplayStatus` |
| `types/financial-account.d.ts` | `FinancialAccount`, `ChargeInstance`, `AccountSummary` |
| `types/tenant-application.d.ts` | *Modify* — `rent_fee` nullable, `financial_account` replaces `application_payment_invoice` |
| `app/api/financial-accounts/index.ts` | Query + mutation hooks |
| `app/api/financial-accounts/server.ts` | Loader fetch |
| `.../financial/index.tsx` | Mode resolution, section composition |
| `.../financial/move-in-gate.tsx` | Blocked state |
| `.../financial/summary-bar.tsx` | Charged / Settled / Outstanding |
| `.../financial/agreed-rent.tsx` | Rent field, prefill, rebuild warning |
| `.../financial/schedule/preview.tsx` | Computed schedule, chips, Create charges |
| `.../financial/schedule/ledger.tsx` | Live charges, removed toggle |
| `.../financial/schedule/rent-group.tsx` | Collapsible rent run |
| `.../financial/schedule/add-charge-dialog.tsx` | Ad-hoc charge form |
| `.../financial/schedule/remove-charge-dialog.tsx` | Void + already-billed refusal |
| `.../financial/collection-plan.tsx` | Cadence cards, auto-issue days |
| `.../financial/collect/index.tsx` | Tab state, payment details, submit |
| `.../financial/collect/invoice-tab.tsx` | Pay an existing invoice |
| `.../financial/collect/compose-tab.tsx` | Pick charges, amount shortcut |
| `.../financial/collect/payments-list.tsx` | Post-approval history |

Deleted at the end of Task 11: `initial-payment-setup.tsx`, `invoice-details.tsx`, `invoice-summary.tsx`, `payment-mode-selector.tsx`, `rent-setup.tsx`, `security-deposit.tsx`.

---

## Task 1: Vitest + the schedule preview

The preview tells the landlord what they are about to create. If it drifts from
`materialise.go` the page lies, so this is the one piece that genuinely needs
tests.

**Files:**
- Create: `apps/property-manager/vitest.config.ts`
- Create: `apps/property-manager/app/lib/schedule.ts`
- Create: `apps/property-manager/app/lib/schedule.test.ts`
- Modify: `apps/property-manager/package.json` — add `test` script + dev deps

**Interfaces:**
- Produces: `buildSchedule(input: ScheduleInput): SchedulePeriod[]`, `graceDays(frequency: PaymentFrequency): number`, `periodLabel(date: Date, frequency: PaymentFrequency): string`

- [ ] **Step 1: Add vitest**

```bash
cd apps/property-manager && yarn add -D vitest@2.1.8
```

Add to `package.json` scripts, after `"lint:ci"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `apps/property-manager/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

// Scoped to app/lib deliberately: these are pure functions with no React,
// no network and no router. Component testing would need jsdom and a much
// larger setup, and the design boards are the visual reference instead.
export default defineConfig({
	test: {
		include: ['app/lib/**/*.test.ts'],
		environment: 'node',
	},
	resolve: {
		alias: { '~': new URL('./app/', import.meta.url).pathname },
	},
})
```

- [ ] **Step 2: Write the failing tests**

Create `apps/property-manager/app/lib/schedule.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { buildSchedule, graceDays } from './schedule'

// Grace periods mirror lib.RentInvoiceGracePeriod in the Go backend.
describe('graceDays', () => {
	test('matches the backend for every frequency', () => {
		expect(graceDays('MONTHLY')).toBe(7)
		expect(graceDays('QUARTERLY')).toBe(14)
		expect(graceDays('BIANNUALLY')).toBe(14)
		expect(graceDays('ANNUALLY')).toBe(30)
		expect(graceDays('WEEKLY')).toBe(3)
		expect(graceDays('DAILY')).toBe(0)
	})
})

describe('buildSchedule', () => {
	const base = {
		rent: 100000,
		moveIn: '2026-09-01T00:00:00Z',
		periods: 12,
		frequency: 'MONTHLY' as const,
	}

	test('produces one period per month of the term', () => {
		expect(buildSchedule(base)).toHaveLength(12)
	})

	// The rule people get wrong: rent is DUE seven days after the period
	// starts, not on the first. Verified end to end by case A1.
	test('due date is period start plus the grace period', () => {
		const s = buildSchedule(base)
		expect(s[0].periodStart.toISOString()).toBe('2026-09-01T00:00:00.000Z')
		expect(s[0].dueDate.toISOString()).toBe('2026-09-08T00:00:00.000Z')
		expect(s[1].dueDate.toISOString()).toBe('2026-10-08T00:00:00.000Z')
	})

	test('every period carries one period of rent, never a multiple', () => {
		for (const p of buildSchedule(base)) expect(p.amount).toBe(100000)
	})

	test('labels read as the month the rent covers', () => {
		const s = buildSchedule(base)
		expect(s[0].name).toBe('Rent – September 2026')
		expect(s[11].name).toBe('Rent – August 2027')
	})

	test('quarterly terms step three months and use a 14 day grace', () => {
		const s = buildSchedule({ ...base, periods: 4, frequency: 'QUARTERLY' })
		expect(s).toHaveLength(4)
		expect(s[1].periodStart.toISOString()).toBe('2026-12-01T00:00:00.000Z')
		expect(s[0].dueDate.toISOString()).toBe('2026-09-15T00:00:00.000Z')
	})

	test('a zero or negative term produces nothing', () => {
		expect(buildSchedule({ ...base, periods: 0 })).toHaveLength(0)
	})
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd apps/property-manager && yarn test`
Expected: FAIL — `Failed to resolve import "./schedule"`.

- [ ] **Step 4: Implement**

Create `apps/property-manager/app/lib/schedule.ts`:

```ts
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
```

- [ ] **Step 5: Run tests**

Run: `cd apps/property-manager && yarn test`
Expected: PASS, 7 tests.

- [ ] **Step 6: Verify types and lint**

Run: `yarn types:check && yarn lint`
Expected: both clean. Leave unstaged — do not commit.

---

## Task 2: Cadence mapping and display status

**Files:**
- Create: `apps/property-manager/app/lib/cadence.ts`
- Create: `apps/property-manager/app/lib/cadence.test.ts`
- Create: `apps/property-manager/app/lib/display-status.ts`
- Create: `apps/property-manager/app/lib/display-status.test.ts`

**Interfaces:**
- Produces: `COLLECTION_CHOICES`, `cadenceForChoice(choice, periods)`, `choiceForPolicy(cadence, interval)`, `chargeDisplayStatus(charge)`, `invoiceDisplayStatus(invoice, now?)`

- [ ] **Step 1: Write the failing cadence tests**

Create `app/lib/cadence.test.ts`:

```ts
import { expect, test } from 'vitest'
import { cadenceForChoice, choiceForPolicy } from './cadence'

// The four cadences the API accepts. WHOLE_TERM is not one of them.
test('every month stores EVERY_PERIOD', () => {
	expect(cadenceForChoice('monthly', 12)).toEqual({ cadence: 'EVERY_PERIOD' })
})

test('every quarter stores an explicit interval', () => {
	expect(cadenceForChoice('quarterly', 12)).toEqual({
		cadence: 'EVERY_N_PERIODS',
		interval: 3,
	})
})

// "Whole term up front" is a collection action, not a schedule: nothing is
// issued automatically because the landlord is taking the money now.
test('whole term stores MANUAL', () => {
	expect(cadenceForChoice('whole-term', 12)).toEqual({ cadence: 'MANUAL' })
})

test('manual stores MANUAL', () => {
	expect(cadenceForChoice('manual', 12)).toEqual({ cadence: 'MANUAL' })
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
```

- [ ] **Step 2: Write the failing display-status tests**

Create `app/lib/display-status.test.ts`:

```ts
import { expect, test } from 'vitest'
import { chargeDisplayStatus, invoiceDisplayStatus } from './display-status'

const charge = (over: Partial<ChargeInstance> = {}) =>
	({
		id: 'c1',
		amount: 100000,
		invoiced_amount: 0,
		settled_amount: 0,
		status: 'OUTSTANDING',
		voided_at: null,
		due_date: '2026-09-08T00:00:00Z',
		...over,
	}) as ChargeInstance

test('charge statuses read as the landlord thinks of them', () => {
	expect(chargeDisplayStatus(charge()).label).toBe('Not yet billed')
	expect(chargeDisplayStatus(charge({ status: 'INVOICED' })).label).toBe('Billed')
	expect(chargeDisplayStatus(charge({ status: 'SETTLED' })).label).toBe('Paid')
	expect(chargeDisplayStatus(charge({ status: 'VOID' })).label).toBe('Removed')
})

// Invoices use a DIFFERENT vocabulary from charges — ISSUED, not INVOICED.
// A table keyed on the charge words returns undefined for every invoice.
test('invoice statuses use the invoice vocabulary', () => {
	const inv = (status: Invoice['status'], due = '2099-01-01T00:00:00Z') =>
		({ status, due_date: due, total_amount: 100000 }) as Invoice
	expect(invoiceDisplayStatus(inv('ISSUED')).label).toBe('Unpaid')
	expect(invoiceDisplayStatus(inv('PARTIALLY_PAID')).label).toBe('Part paid')
	expect(invoiceDisplayStatus(inv('PAID')).label).toBe('Paid')
	expect(invoiceDisplayStatus(inv('DRAFT')).label).toBe('Draft')
	expect(invoiceDisplayStatus(inv('VOID')).label).toBe('Void')
})

// Overdue exists only on the client — the server has no such status.
test('an unpaid invoice past its due date is overdue', () => {
	const now = new Date('2026-10-01T00:00:00Z')
	const overdue = { status: 'ISSUED', due_date: '2026-09-08T00:00:00Z' } as Invoice
	expect(invoiceDisplayStatus(overdue, now).label).toBe('Overdue')
})

test('a paid invoice past its due date is not overdue', () => {
	const now = new Date('2026-10-01T00:00:00Z')
	const paid = { status: 'PAID', due_date: '2026-09-08T00:00:00Z' } as Invoice
	expect(invoiceDisplayStatus(paid, now).label).toBe('Paid')
})

test('an invoice with no due date is never overdue', () => {
	const now = new Date('2026-10-01T00:00:00Z')
	const undated = { status: 'ISSUED', due_date: null } as Invoice
	expect(invoiceDisplayStatus(undated, now).label).toBe('Unpaid')
})
```

- [ ] **Step 3: Run to verify both fail**

Run: `cd apps/property-manager && yarn test`
Expected: FAIL — cannot resolve `./cadence` and `./display-status`.

- [ ] **Step 4: Implement cadence**

Create `app/lib/cadence.ts`:

```ts
export type RentBillingCadence =
	| 'EVERY_PERIOD'
	| 'EVERY_N_PERIODS'
	| 'UPFRONT'
	| 'MANUAL'

export type CollectionChoice =
	| 'whole-term'
	| 'quarterly'
	| 'monthly'
	| 'manual'

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
export const cadenceForChoice = (
	choice: CollectionChoice,
	_periods: number,
): BillingPolicy => {
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
```

- [ ] **Step 5: Implement display status**

Create `app/lib/display-status.ts`:

```ts
export type DisplayTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger'

export interface DisplayStatus {
	label: string
	tone: DisplayTone
}

/**
 * What the landlord reads for a charge. Derived from the API's status, which is
 * itself derived server-side from invoiced_amount, settled_amount and voided_at
 * — never stored.
 */
export const chargeDisplayStatus = (charge: ChargeInstance): DisplayStatus => {
	switch (charge.status) {
		case 'PARTIALLY_INVOICED':
			return { label: 'Part billed', tone: 'warning' }
		case 'INVOICED':
			return { label: 'Billed', tone: 'info' }
		case 'PARTIALLY_SETTLED':
			return { label: 'Part paid', tone: 'warning' }
		case 'SETTLED':
			return { label: 'Paid', tone: 'success' }
		case 'VOID':
			return { label: 'Removed', tone: 'neutral' }
		default:
			return { label: 'Not yet billed', tone: 'neutral' }
	}
}

/**
 * What the landlord reads for an invoice.
 *
 * Invoices and charges use different vocabularies that overlap in spelling —
 * an invoice is ISSUED where a charge is INVOICED — so this must switch on the
 * invoice's own set. "Overdue" is not a status at all: the server has no such
 * concept, it is an unpaid invoice whose due date has passed.
 */
export const invoiceDisplayStatus = (
	invoice: Invoice,
	now: Date = new Date(),
): DisplayStatus => {
	const unpaid = invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID'
	if (unpaid && invoice.due_date && new Date(invoice.due_date) < now) {
		return { label: 'Overdue', tone: 'danger' }
	}
	switch (invoice.status) {
		case 'DRAFT':
			return { label: 'Draft', tone: 'neutral' }
		case 'ISSUED':
			return { label: 'Unpaid', tone: 'info' }
		case 'PARTIALLY_PAID':
			return { label: 'Part paid', tone: 'warning' }
		case 'PAID':
			return { label: 'Paid', tone: 'success' }
		case 'VOID':
			return { label: 'Void', tone: 'neutral' }
	}
}
```

- [ ] **Step 6: Run tests, types and lint**

Run: `yarn test && yarn types:check && yarn lint`
Expected: all pass (7 + 7 + 6 = 20 tests). `ChargeInstance` will not resolve
until Task 3 — if `types:check` complains, do Task 3 and re-run. Leave unstaged.

---

## Task 3: Types

**Files:**
- Create: `apps/property-manager/types/financial-account.d.ts`
- Modify: `apps/property-manager/types/tenant-application.d.ts:53` and `:63`

**Interfaces:**
- Produces: global `FinancialAccount`, `ChargeInstance`, `ChargeCategory`, `AccountSummary`, `TenantApplicationFinancials`; `TenantApplication.rent_fee` becomes nullable and `financial_account` replaces `application_payment_invoice`.

- [ ] **Step 1: Create the financial account types**

Create `apps/property-manager/types/financial-account.d.ts`:

```ts
type ChargeCategory =
	| 'RENT'
	| 'SECURITY_DEPOSIT'
	| 'AGENCY_FEE'
	| 'VAT'
	| 'UTILITY'
	| 'DAMAGE_CHARGE'
	| 'EARLY_TERMINATION_FEE'
	| 'OTHER'

type ChargeStatus =
	| 'OUTSTANDING'
	| 'PARTIALLY_INVOICED'
	| 'INVOICED'
	| 'PARTIALLY_SETTLED'
	| 'SETTLED'
	| 'VOID'

interface ChargeInstance {
	id: string
	financial_account_id: string
	name: string
	category: ChargeCategory
	/** Signed. Negative is a refund. Minor units. */
	amount: number
	currency: string
	due_date: string
	period_start?: Nullable<string>
	period_end?: Nullable<string>
	/** Claimed by a live invoice line. */
	invoiced_amount: number
	/** Covered by payments. */
	settled_amount: number
	/** amount − settled_amount. */
	outstanding_amount: number
	status: ChargeStatus
	voided_at?: Nullable<string>
	voided_reason?: Nullable<string>
	created_at: string
	updated_at: string
}

interface FinancialAccount {
	id: string
	code: string
	tenant_application_id: string
	lease_id?: Nullable<string>
	client_id?: Nullable<string>
	property_id?: Nullable<string>
	tenant_id?: Nullable<string>
	currency: string
	rent_billing_cadence: 'EVERY_PERIOD' | 'EVERY_N_PERIODS' | 'UPFRONT' | 'MANUAL'
	rent_billing_interval: number
	auto_issue_days_before: number
	status: 'ACTIVE' | 'CLOSED'
	closed_at?: Nullable<string>
	created_at: string
	updated_at: string
}

/** GET /financial-accounts/{id} */
interface AccountSummary {
	account: FinancialAccount
	charges: Array<ChargeInstance>
	total_charged: number
	total_settled: number
	outstanding_amount: number
	/** Structurally always 0 — overpayment is refused. Do not build UI for it. */
	available_credit: number
}

/** The summary carried on a tenant application. */
interface TenantApplicationFinancials {
	id: string
	code: string
	currency: string
	total_charged: number
	total_settled: number
	outstanding_amount: number
	available_credit: number
	charge_count: number
	invoice_count: number
}
```

- [ ] **Step 2: Update the application type**

In `apps/property-manager/types/tenant-application.d.ts`, change line 53 from
`rent_fee: number` to:

```ts
	/**
	 * The agreed rent, in minor units. NULL on a new application — the unit's
	 * rent is a prefill the UI offers, never inherited by the API. Until this is
	 * set, charges:prepare returns 400 ApplicationMissingRentDetails.
	 */
	rent_fee: Nullable<number>
```

Replace line 63 (`application_payment_invoice: Nullable<Invoice>`) with:

```ts
	/**
	 * Null until charges:prepare runs. Its presence is what switches the
	 * financial setup page from preview mode to the live ledger.
	 */
	financial_account: Nullable<TenantApplicationFinancials>
```

- [ ] **Step 3: Find every consumer of the removed field**

Run: `cd apps/property-manager && grep -rn "application_payment_invoice" app/`

Expected: hits in the financial module (deleted in Task 11) and possibly the
application overview. Update non-financial consumers to read
`financial_account`; the financial module's hits are replaced wholesale.

- [ ] **Step 4: Verify**

Run: `yarn types:check && yarn test && yarn lint`
Expected: types clean, the 20 tests from Tasks 1–2 pass. Leave unstaged.

---

## Task 4: The API layer

**Files:**
- Create: `apps/property-manager/app/api/financial-accounts/index.ts`
- Create: `apps/property-manager/app/api/financial-accounts/server.ts`
- Modify: `apps/property-manager/app/lib/constants.ts` — add query key

**Interfaces:**
- Produces: `useGetFinancialAccount`, `usePrepareCharges`, `useCreateCharge`, `useVoidCharge`, `useUpdateBillingPolicy`, `useComposeInvoice`, `usePayInvoice`, `getFinancialAccountForServer`

- [ ] **Step 1: Add the query key**

In `app/lib/constants.ts`, inside `QUERY_KEYS` after `EXPENSES`:

```ts
	FINANCIAL_ACCOUNT: 'financial-account',
```

- [ ] **Step 2: Write the client hooks**

Create `app/api/financial-accounts/index.ts`:

```ts
import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient } from '~/lib/transport'

const scope = (clientId: string, propertyId: string) =>
	`/v1/admin/clients/${clientId}/properties/${propertyId}`

const unwrap = async (error: unknown): Promise<never> => {
	if (error instanceof Response) {
		const body = await error.json()
		throw new Error(body.errors?.message || 'Unknown error')
	}
	if (error instanceof Error) throw error
	throw new Error('Unknown error')
}

/** GET the account with its charges. include_voided reveals removed charges. */
const getFinancialAccount = async (
	clientId: string,
	propertyId: string,
	accountId: string,
	includeVoided: boolean,
) => {
	try {
		const query = includeVoided ? '?include_voided=true' : ''
		const response = await fetchClient<ApiResponse<AccountSummary>>(
			`${scope(clientId, propertyId)}/financial-accounts/${accountId}${query}`,
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const useGetFinancialAccount = (
	clientId: string,
	propertyId: string,
	accountId: Nullable<string>,
	includeVoided = false,
	initialData?: AccountSummary,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.FINANCIAL_ACCOUNT,
			clientId,
			propertyId,
			accountId,
			includeVoided,
		],
		queryFn: () =>
			getFinancialAccount(clientId, propertyId, accountId!, includeVoided),
		enabled: !!clientId && !!propertyId && !!accountId,
		initialData,
	})

/** POST charges:prepare — one-way. A second call returns 400. */
const prepareCharges = async ({
	client_id,
	property_id,
	application_id,
}: {
	client_id: string
	property_id: string
	application_id: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<FinancialAccount>>(
			`${scope(client_id, property_id)}/tenant-applications/${application_id}/charges:prepare`,
			{ method: 'POST' },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const usePrepareCharges = () =>
	useMutation({ mutationFn: prepareCharges })

/** POST a one-off charge. There is no edit endpoint — remove and re-add. */
const createCharge = async ({
	client_id,
	property_id,
	account_id,
	data,
}: {
	client_id: string
	property_id: string
	account_id: string
	data: {
		name: string
		category: ChargeCategory
		amount: number
		currency: string
		due_date: string
	}
}) => {
	try {
		const response = await fetchClient<ApiResponse<ChargeInstance>>(
			`${scope(client_id, property_id)}/financial-accounts/${account_id}/charges`,
			{ method: 'POST', body: JSON.stringify(data) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const useCreateCharge = () => useMutation({ mutationFn: createCharge })

/** PATCH charges/{id}/void — the only way to remove a charge. */
const voidCharge = async ({
	client_id,
	property_id,
	account_id,
	charge_id,
	reason,
}: {
	client_id: string
	property_id: string
	account_id: string
	charge_id: string
	reason: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<boolean>>(
			`${scope(client_id, property_id)}/financial-accounts/${account_id}/charges/${charge_id}/void`,
			{ method: 'PATCH', body: JSON.stringify({ reason }) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const useVoidCharge = () => useMutation({ mutationFn: voidCharge })

/** PATCH billing-policy. */
const updateBillingPolicy = async ({
	client_id,
	property_id,
	account_id,
	data,
}: {
	client_id: string
	property_id: string
	account_id: string
	data: {
		cadence: string
		interval?: number
		auto_issue_days_before?: number
	}
}) => {
	try {
		const response = await fetchClient<ApiResponse<boolean>>(
			`${scope(client_id, property_id)}/financial-accounts/${account_id}/billing-policy`,
			{ method: 'PATCH', body: JSON.stringify(data) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const useUpdateBillingPolicy = () =>
	useMutation({ mutationFn: updateBillingPolicy })

/**
 * POST invoices:compose — the only way an account-backed invoice is created.
 * Exactly one of claims or amount; both or neither is 400.
 */
const composeInvoice = async ({
	client_id,
	property_id,
	account_id,
	data,
}: {
	client_id: string
	property_id: string
	account_id: string
	data: {
		claims?: Array<{ charge_instance_id: string; amount: number }>
		amount?: number
		due_date?: string
		issue: boolean
	}
}) => {
	try {
		const response = await fetchClient<ApiResponse<Invoice>>(
			`${scope(client_id, property_id)}/financial-accounts/${account_id}/invoices:compose`,
			{ method: 'POST', body: JSON.stringify(data) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const useComposeInvoice = () =>
	useMutation({ mutationFn: composeInvoice })

/** POST invoices/{id}/pay — creates AND verifies the payment. Returns 204. */
const payInvoice = async ({
	client_id,
	property_id,
	invoice_id,
	data,
}: {
	client_id: string
	property_id: string
	invoice_id: string
	data: {
		payment_account_id: string
		amount: number
		provider: string
		reference?: string
	}
}) => {
	try {
		await fetchClient<ApiResponse<null>>(
			`${scope(client_id, property_id)}/invoices/${invoice_id}/pay`,
			{ method: 'POST', body: JSON.stringify(data) },
		)
		return true
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const usePayInvoice = () => useMutation({ mutationFn: payInvoice })
```

- [ ] **Step 3: Write the loader fetch**

Create `app/api/financial-accounts/server.ts`:

```ts
import { fetchServer } from '~/lib/transport'

/** SSR fetch for the account summary, used as TanStack Query initialData. */
export const getFinancialAccountForServer = async (
	clientId: string,
	props: { property_id: string; account_id: string },
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<AccountSummary>>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/properties/${props.property_id}/financial-accounts/${props.account_id}`,
			{ ...apiConfig },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		console.error('Error fetching financial account:', error)
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}
```

- [ ] **Step 4: Verify**

Run: `yarn types:check && yarn lint`
Expected: clean. Leave unstaged.

---

## Task 5: Page shell, mode resolution, move-in gate

**Files:**
- Rewrite: `app/modules/.../application/financial/index.tsx`
- Create: `app/modules/.../application/financial/move-in-gate.tsx`
- Create: `app/modules/.../application/financial/summary-bar.tsx`

**Interfaces:**
- Consumes: `useGetFinancialAccount` (Task 4), `TenantApplicationFinancials` (Task 3)
- Produces: `type FinancialMode = 'blocked' | 'setup' | 'live' | 'locked' | 'readonly'`, `resolveMode(application, summary)`

- [ ] **Step 1: Implement mode resolution**

In `index.tsx`. The five modes and exactly what decides each:

```tsx
export type FinancialMode = 'blocked' | 'setup' | 'live' | 'locked' | 'readonly'

/**
 * Move-in setup supplies three of the six fields charges:prepare needs, so
 * without it the server refuses. The agreed rent is the fourth and is null on a
 * new application — which is what makes the rent field the gate rather than a
 * convenience.
 */
const moveInComplete = (a: TenantApplication) =>
	!!a.desired_move_in_date && !!a.stay_duration && !!a.stay_duration_frequency

export const resolveMode = (
	application: TenantApplication,
	summary: Nullable<AccountSummary>,
): FinancialMode => {
	if (application.status === 'TenantApplication.Status.Completed')
		return 'readonly'
	if (!moveInComplete(application)) return 'blocked'
	if (!application.financial_account || !summary) return 'setup'
	// Any charge that has been invoiced or settled freezes the rent terms —
	// RederiveRent returns 400 ChargesAlreadyBilled from that point.
	const billed = summary.charges.some(
		(c) => c.invoiced_amount !== 0 || c.settled_amount !== 0,
	)
	return billed ? 'locked' : 'live'
}
```

- [ ] **Step 2: Compose the page**

`index.tsx` renders, in order: `MoveInGate` when blocked, `SummaryBar` when the
account exists, then the four sections, with the checklist rail beside them.
Layout follows the detail-page grid from `apps/property-manager/CLAUDE.md`:
main `col-span-12 lg:col-span-8`, rail `col-span-12 lg:col-span-4`.

```tsx
export function PropertyTenantApplicationFinancial() {
	const { tenantApplication } = useTenantApplicationContext()
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const loaderData = useLoaderData<typeof loader>()

	const clientId = safeString(clientUser?.client_id)
	const propertyId = safeString(clientUserProperty?.property_id)
	const accountId = tenantApplication.financial_account?.id ?? null

	const [showVoided, setShowVoided] = useState(false)
	const { data: summary } = useGetFinancialAccount(
		clientId,
		propertyId,
		accountId,
		showVoided,
		loaderData.financialAccount ?? undefined,
	)

	const mode = resolveMode(tenantApplication, summary ?? null)
	// … sections
}
```

- [ ] **Step 3: Build the gate**

`move-in-gate.tsx` — a Card with `shadow-none`, an explanation, and a link to
the move-in step. Copy from the design's `FGate`: *"The rent schedule is built
from the move-in date and how long the tenant is staying. Neither is set yet, so
there is nothing to charge against."* Use `bg-muted` / `text-muted-foreground`,
not the design's `rgba(233,123,42,0.06)`.

- [ ] **Step 4: Build the summary bar**

`summary-bar.tsx` — three stats from `AccountSummary`: Charged, Settled, and
Outstanding (larger, primary colour). Outstanding carries the caption **"Only a
payment moves this — invoicing does not"**, which is the rule people get wrong.
Do **not** render `available_credit`; it is structurally always 0.

- [ ] **Step 5: Verify in the browser**

Run: `yarn dev`, open an application with no move-in date.
Expected: the gate renders and no sections are interactive. Check both themes
with the theme toggle. Then `yarn types:check && yarn lint`. Leave unstaged.

---

## Task 6: Section 1 — agreed rent

**Files:**
- Create: `app/modules/.../application/financial/agreed-rent.tsx`

**Interfaces:**
- Consumes: `useAdminUpdateTenantApplication` from `~/api/tenant-applications`, `FinancialMode` (Task 5)
- Produces: `<AgreedRent mode application accountRent onSaved />`

- [ ] **Step 1: The field and the prefill**

An amount input in cedis, converted with `convertCedisToPesewas` on save. Empty
when `application.rent_fee` is null. Beneath it: *"Unit B4 is listed at GH₵
1,000.00"* with a **Use listed rent** button that fills the field. The unit's
figure is a suggestion, never a default.

- [ ] **Step 2: The rebuild warning**

In `live` mode the schedule already exists, so saving a different rent
re-derives every rent charge. Never do that silently:

```tsx
// accountRent is the amount on the existing RENT charges. A different figure
// means saving will void all of them and create new ones — allowed while
// nothing is billed, refused with ChargesAlreadyBilled once anything is.
const rebuilds = mode === 'live' && minor > 0 && minor !== accountRent

{rebuilds && (
	<Alert variant="destructive">
		<AlertTitle>Saving this rebuilds the rent schedule</AlertTitle>
		<AlertDescription>
			The {periods} rent charges were derived from {formatAmount(...)}.
			Saving removes them and creates {periods} new ones at {formatAmount(...)}
			— {formatAmount(newTotal)} over the term instead of {formatAmount(oldTotal)}.
			One-off charges are untouched.
		</AlertDescription>
	</Alert>
)}
```

Actions become **Discard** and **Save and rebuild**.

- [ ] **Step 3: The locked state**

In `locked` and `readonly` the field is disabled with an explanation. Locked:
*"Rent can't change — payment has already been collected. Changing rent rebuilds
every rent charge, which is refused once anything is billed. Add a one-off charge
instead."* with an **Add a charge** action. Readonly: *"Rent is fixed — this
application is now a lease."*

- [ ] **Step 4: Handle the server's refusal**

`PATCH /tenant-applications/{id}` returns `400 ChargesAlreadyBilled` if a charge
was billed between render and save. The application is rolled back with the
charges, so nothing is half-applied. Show the error inline on the field and
refetch:

```tsx
onError: (error) => {
	if (error.message === 'ChargesAlreadyBilled') {
		setFieldError(
			'A payment was collected while you were editing. Rent is now fixed — add a one-off charge instead.',
		)
		void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT] })
		return
	}
	toast.error('Could not save the rent. Please try again.')
}
```

- [ ] **Step 5: Verify**

Run: `yarn dev`. With no rent set, confirm the field is empty and the prefill
button works. Save a rent, then change it and confirm the rebuild warning
quantifies the change. Both themes. Then `yarn types:check && yarn lint`.

---

## Task 7: Section 2a — preview and Create charges

The one genuinely multi-call action on the page.

**Files:**
- Create: `app/modules/.../application/financial/schedule/preview.tsx`
- Create: `app/modules/.../application/financial/schedule/rent-group.tsx`

**Interfaces:**
- Consumes: `buildSchedule` (Task 1), `usePrepareCharges` + `useCreateCharge` (Task 4)
- Produces: `<SchedulePreview application onCreated />`, `<RentGroup periods open onToggle />`

- [ ] **Step 1: Render the computed preview**

`buildSchedule` from the application's rent, move-in date, stay duration and
payment frequency. Twelve rows collapse into one `RentGroup` — *"12 monthly rent
charges · Sep 2026 – Aug 2027 · GH₵ 1,000.00 each"* — expandable. Show due
dates, not period starts.

- [ ] **Step 2: Suggestion chips**

`Security deposit` · `Agency fee` · `VAT` · `Something else`. Selecting one adds
a queued extra with an editable amount, defaulting: deposit = one month's rent,
agency fee = 50000, VAT = 7500. These are the mitigation for the deposit no
longer being a term — without them it is easy to forget.

- [ ] **Step 3: Implement the create sequence**

This is `prepare` **plus one `POST /charges` per queued extra**. Partial failure
is possible and must be reported honestly:

```tsx
const create = async () => {
	setBusy(true)
	// 1. prepare — creates the rent charges. One-way; a second call is 400.
	let account: FinancialAccount
	try {
		account = await prepareCharges.mutateAsync({
			client_id: clientId,
			property_id: propertyId,
			application_id: application.id,
		})
	} catch (error) {
		setBusy(false)
		toast.error(
			(error as Error).message === 'ApplicationMissingRentDetails'
				? 'Set the agreed rent before creating charges.'
				: 'Could not create the charges. Nothing was created.',
		)
		return
	}

	// 2. each extra, independently. The rent charges already exist, so a
	// failure here is partial, not total — say which ones landed.
	const failed: string[] = []
	for (const extra of extras) {
		try {
			await createCharge.mutateAsync({
				client_id: clientId,
				property_id: propertyId,
				account_id: account.id,
				data: {
					name: extra.name,
					category: extra.category,
					amount: extra.amount,
					currency: application.rent_fee_currency ?? 'GHS',
					due_date: application.desired_move_in_date!,
				},
			})
		} catch {
			failed.push(extra.name)
		}
	}

	setBusy(false)
	void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTY_TENANT_APPLICATIONS] })
	void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT] })

	if (failed.length === 0) {
		toast.success(`${periods + extras.length} charges created.`)
	} else {
		toast.warning(
			`Charges created, but ${failed.join(' and ')} could not be added. Add ${failed.length === 1 ? 'it' : 'them'} from the ledger.`,
		)
	}
	onCreated()
}
```

The success message must report what actually landed — never a hardcoded count.

- [ ] **Step 4: The due-date note**

Beneath the preview: *"Rent falls due 7 days after each period starts — 8 Sep, 8
Oct, and so on. Creating the charges is one-way, but you can still change the
rent or the term afterwards while nothing has been billed."* Derive the "7" from
`graceDays(frequency)` rather than hardcoding.

- [ ] **Step 5: Verify**

Run: `yarn dev`. Type a rent and confirm the preview appears with correct due
dates; queue a deposit and an agency fee; press Create; confirm the ledger
appears with 12 + 2 charges and the toast reports 14. Both themes. Then
`yarn types:check && yarn lint`.

---

## Task 8: Section 2b — the ledger, add and remove

**Files:**
- Create: `app/modules/.../application/financial/schedule/ledger.tsx`
- Create: `app/modules/.../application/financial/schedule/add-charge-dialog.tsx`
- Create: `app/modules/.../application/financial/schedule/remove-charge-dialog.tsx`

**Interfaces:**
- Consumes: `useCreateCharge`, `useVoidCharge` (Task 4), `chargeDisplayStatus` (Task 2), `RentGroup` (Task 7)

- [ ] **Step 1: The ledger**

One-offs in due-date order first, then the collapsed rent run — due-date order is
the order payment fills them. Each row: name, due date, status badge from
`chargeDisplayStatus`, amount, and a remove button (hidden in `readonly`).

- [ ] **Step 2: Removed charges**

A footer toggle — *"Show N removed charges"* — that flips `include_voided` on the
query. Removed rows render dimmed and struck through with their reason and date.
The totals do **not** change: the server excludes voided charges from every
total regardless of the flag (case E3). Add the note: *"Removed charges stay in
the record but are excluded from every total. Charges can't be edited — remove
and re-add."*

- [ ] **Step 3: Add-charge dialog**

Category chips (the eight `ChargeCategory` values, minus `RENT`), a name, an
amount, a due date defaulting to move-in. Include the warning: *"Charges can't be
edited once created — if the amount is wrong you remove this one and add
another."* That is true: there is no `PATCH /charges/{id}`.

- [ ] **Step 4: Remove-charge dialog, two states**

Clean charge: a reason field with quick chips (*Charged in error*, *Waived for
the tenant*, *Duplicate*), and the note that it stays in the record.

Already billed — the server returns `400 ChargeAlreadyBilled`. Do not surface
this as a toast after the fact; when `charge.invoiced_amount !== 0`, open the
refusal state directly:

```tsx
<DialogTitle>This charge is already on an invoice</DialogTitle>
<DialogDescription>
	{charge.name} was claimed by an invoice. A billed charge can't be removed
	while that invoice stands.
</DialogDescription>
<Alert>
	<AlertTitle>To remove it</AlertTitle>
	<AlertDescription>
		Void the invoice first. That releases the claim and the charge becomes
		removable again.
	</AlertDescription>
</Alert>
```

- [ ] **Step 5: Verify**

Run: `yarn dev`. Add a utility charge, confirm it appears in due-date order and
the balance rises. Remove it, confirm it disappears and the balance drops, then
toggle removed charges and confirm it reappears dimmed with its reason and the
totals unchanged. Both themes. Then `yarn types:check && yarn lint`.

---

## Task 9: Section 3 — the collection plan

**Files:**
- Create: `app/modules/.../application/financial/collection-plan.tsx`

**Interfaces:**
- Consumes: `COLLECTION_CHOICES`, `cadenceForChoice`, `choiceForPolicy` (Task 2), `useUpdateBillingPolicy` (Task 4)

- [ ] **Step 1: Radio cards with real arithmetic**

Four choices from `COLLECTION_CHOICES`. Each subtitle counts actual money, and
the first invoice is never rent alone — due one-offs are swept in with it
(case I3):

```tsx
const rentEach = rentCharges[0]?.amount ?? 0
const months = rentCharges.length
const oneOffs = charges.filter((c) => c.category !== 'RENT')
const extras = oneOffs.reduce((sum, c) => sum + c.amount, 0)

const subtitles: Record<CollectionChoice, string> = {
	'whole-term': `1 invoice · ${months + oneOffs.length} charges · ${formatAmount(convertPesewasToCedis(rentEach * months + extras))}`,
	quarterly: `4 invoices · first ${formatAmount(convertPesewasToCedis(rentEach * 3 + extras))}, then ${formatAmount(convertPesewasToCedis(rentEach * 3))}`,
	monthly: `${months} invoices · first ${formatAmount(convertPesewasToCedis(rentEach + extras))}, then ${formatAmount(convertPesewasToCedis(rentEach))}`,
	manual: 'Nothing is issued automatically',
}
```

- [ ] **Step 2: Default to what is actually stored**

`choiceForPolicy(account.rent_billing_cadence, account.rent_billing_interval)`.
A freshly prepared account is `MANUAL` (case I5), so "I'll invoice manually" is
pre-selected — it is the truth, not a guess. Never default to monthly.

- [ ] **Step 3: Whole-term is a collection action**

Selecting it stores `MANUAL`, then selects every outstanding charge in section 4
and scrolls there:

```tsx
const onChoice = async (choice: CollectionChoice) => {
	setChoice(choice)
	await updatePolicy.mutateAsync({
		client_id: clientId,
		property_id: propertyId,
		account_id: account.id,
		data: {
			...cadenceForChoice(choice, months),
			auto_issue_days_before: autoIssueDays,
		},
	})
	if (choice === 'whole-term') {
		onSelectAllForCollection()
		collectSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}
}
```

- [ ] **Step 4: Auto-issue days**

A stepper for `auto_issue_days_before`, dimmed when the choice is manual or
whole-term (nothing is issued, so lead time is meaningless). Label it *"Issue
each invoice N days before it is due"* — this is issuance lead time, not the
payment grace from Task 1.

- [ ] **Step 5: Verify**

Run: `yarn dev`. On a fresh ledger confirm "I'll invoice manually" is selected.
Pick Every month, reload, confirm it persists. Pick Whole term and confirm
section 4 fills and scrolls. Both themes. Then `yarn types:check && yarn lint`.

---

## Task 10: Section 4 — collecting payment

**Files:**
- Create: `app/modules/.../application/financial/collect/index.tsx`
- Create: `app/modules/.../application/financial/collect/invoice-tab.tsx`
- Create: `app/modules/.../application/financial/collect/compose-tab.tsx`
- Create: `app/modules/.../application/financial/collect/payments-list.tsx`

**Interfaces:**
- Consumes: `useComposeInvoice`, `usePayInvoice`, `useGetInvoices` (`~/api/invoices`), `invoiceDisplayStatus` (Task 2)

- [ ] **Step 1: Tab selection**

Two tabs, but only when unpaid invoices exist. **Against an invoice** leads when
they do; otherwise only **Compose a new one** shows. Under `MANUAL` no invoice
can be unpaid — composing always records payment — so the tabs only appear once
a cadence is chosen and the cron has issued.

- [ ] **Step 2: The invoice tab**

List unpaid invoices for the account (`ISSUED` / `PARTIALLY_PAID`), each with its
code, `invoiceDisplayStatus` badge, line count, due date and remaining balance.
Selecting one expands its lines, showing which are settled — payment fills
**oldest-due-first**, and a line can be *partly* settled, so render the settled
amount per line rather than a paid/unpaid boolean.

An amount field defaults to the full balance with a **Pay the balance** shortcut.

- [ ] **Step 3: The over-payment guard**

Paying more than the invoice has left is `400 PaymentExceedsInvoiceBalance`.
Catch it before the request:

```tsx
const remaining = invoice.total_amount - paidSoFar
const over = amountMinor > remaining

{over && (
	<Alert variant="destructive">
		<AlertTitle>That is more than the invoice has left</AlertTitle>
		<AlertDescription>
			{invoice.code} has {formatAmount(convertPesewasToCedis(remaining))} outstanding.
			Reduce the amount, or compose a second invoice for the rest.
		</AlertDescription>
	</Alert>
)}
```

Disable the submit while `over`. Paying **less** is fine — it leaves the invoice
part paid and settles its lines oldest-first.

- [ ] **Step 4: The compose tab**

A checklist of charges that can still be claimed. The filter matters — claiming a
fully-claimed charge is `400 ClaimExceedsChargeBalance`:

```tsx
// A charge is claimable for whatever is NOT yet invoiced. A partially invoiced
// charge still has a remainder and stays offered (case B5); only a fully
// claimed one drops out.
const claimable = (c: ChargeInstance) => c.amount - c.invoiced_amount
const candidates = charges
	.filter((c) => c.status !== 'VOID' && claimable(c) > 0)
	.sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date))
```

Show a note when charges were excluded: *"N charges are already on an invoice and
aren't listed here — a charge can only be invoiced once. To take money for them,
switch to Against an invoice."*

- [ ] **Step 5: The amount shortcut**

Typing an amount fills oldest-due-first — the same walk the backend uses — and
ticks the resulting rows. If it reaches past the visible five, expand the list so
nothing is selected off-screen:

```tsx
const applyAmount = (value: string) => {
	setAmount(value)
	let left = convertCedisToPesewas(parseFloat(value.replace(/,/g, '')) || 0)
	const next: Record<string, number> = {}
	for (const c of candidates) {
		if (left <= 0) break
		const take = Math.min(claimable(c), left)
		next[c.id] = take
		left -= take
	}
	setPicked(next)
	if (Object.keys(next).length > VISIBLE_ROWS) setShowAll(true)
}
```

- [ ] **Step 6: Recording the payment**

Compose then pay, in that order. Composing bills but does not settle — only the
payment moves `outstanding_amount`:

```tsx
const record = async () => {
	const claims = Object.entries(picked).map(([charge_instance_id, amount]) => ({
		charge_instance_id,
		amount,
	}))
	const invoice = await composeInvoice.mutateAsync({
		client_id: clientId, property_id: propertyId, account_id: account.id,
		data: { claims, issue: true },
	})
	await payInvoice.mutateAsync({
		client_id: clientId, property_id: propertyId, invoice_id: invoice.id,
		data: {
			payment_account_id: paymentAccountId,
			amount: total,
			provider,
			reference: reference || undefined,
		},
	})
	void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT] })
	void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
	toast.success(`Payment of ${formatAmount(convertPesewasToCedis(total))} recorded.`)
}
```

The payment account must be an **ACTIVE OFFLINE** account — fetch with
`useGetPaymentAccounts` and filter. If none exists, disable the section and say
so rather than failing at submit.

- [ ] **Step 7: Readonly payments list**

After approval, section 4 becomes a history: each payment's invoice code, what it
settled, date and amount, with **Open lease financials** replacing the form.

- [ ] **Step 8: Verify**

Run: `yarn dev`. Tick the deposit and first rent, confirm the total, record the
payment; confirm Outstanding drops and both charges read Paid. Type an amount and
confirm ticks update and the list expands past five. Both themes. Then
`yarn types:check && yarn lint`.

---

## Task 11: Route loader, cleanup, final verification

**Files:**
- Modify: `app/routes/_auth.properties.$propertyId.occupancy.applications.$applicationId.financial.tsx`
- Delete: six superseded files in the financial module

- [ ] **Step 1: Add the loader**

```tsx
export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	// The account id lives on the application, which the parent route already
	// loaded — so this only runs once charges exist.
	const accountId = params.accountId
	if (!accountId) return { financialAccount: null }
	try {
		const financialAccount = await getFinancialAccountForServer(
			safeString(params.clientId),
			{ property_id: safeString(params.propertyId), account_id: accountId },
			{ authToken, baseUrl },
		)
		return { financialAccount }
	} catch {
		return { financialAccount: null }
	}
}
```

If the account id is not available as a route param, drop the loader and let the
TanStack Query hook fetch client-side — the page still works, it just renders a
loading state first. Do not invent a param that does not exist.

- [ ] **Step 2: Delete the superseded files**

```bash
cd apps/property-manager/app/modules/properties/property/occupancy/applications/application/financial
rm initial-payment-setup.tsx invoice-details.tsx invoice-summary.tsx \
   payment-mode-selector.tsx rent-setup.tsx security-deposit.tsx
```

- [ ] **Step 3: Confirm nothing else imported them**

Run: `cd apps/property-manager && grep -rn "initial-payment-setup\|invoice-summary\|payment-mode-selector\|rent-setup\|security-deposit" app/`
Expected: no results.

- [ ] **Step 4: Full verification**

Run: `yarn test && yarn types:check && yarn lint && yarn build`
Expected: 20 tests pass, types clean, lint clean, build succeeds.

- [ ] **Step 5: Walk all five modes in the browser, both themes**

| Mode | How to reach it | Expect |
|---|---|---|
| blocked | application with no move-in date | Gate only |
| setup | move-in set, no charges | Empty rent field, preview once typed |
| live | after Create charges | Ledger, plan on Manual, collect available |
| locked | after recording a payment | Rent read-only with reason |
| readonly | approved application | History, link to lease financials |

Toggle dark mode on each. Any hardcoded colour from the design will show up here.

- [ ] **Step 6: Leave unstaged**

Run: `git status --short`. Do **not** commit.

---

## Self-Review

**Spec coverage.** §1.1 application fields → Task 3. §1.2 charges → Tasks 3, 8.
§1.3 endpoints → Task 4. §1.4 rules: 1 and 2b → Tasks 5, 7, 9; 3 → Task 6;
4 → Task 1; 5 and 17 → Task 10 step 4; 6 → Task 5 step 4; 7 → Task 10 step 3;
8 → Task 4; 9 → Task 8 step 4; 10 → Task 8 step 2; 11 → Task 9 step 1;
12 → out of scope (issue-without-payment excluded); 13 → Task 8 step 3;
14 → Task 5 step 4; 15 → Task 2; 16 → Task 10 step 2. §1.5 preview → Task 1.
§2.1 shape → Tasks 5–10. §2.2 modes → Task 5. §2.3 files → all. §2.4 data flow →
Tasks 4, 11. §2.5 error states → Tasks 6, 7, 8, 10. §2.6 exclusions → respected.

**Placeholder scan.** No TBDs. Task 11 step 1 states an explicit fallback rather
than assuming a route param exists. Task 5 step 3 and Task 8 give copy verbatim
rather than "add appropriate messaging".

**Type consistency.** `buildSchedule` / `graceDays` / `periodLabel` (Task 1) are
used under those names in Tasks 7 and 9. `cadenceForChoice` / `choiceForPolicy` /
`CollectionChoice` (Task 2) in Task 9. `chargeDisplayStatus` /
`invoiceDisplayStatus` (Task 2) in Tasks 8 and 10. `AccountSummary` /
`ChargeInstance` / `FinancialAccount` (Task 3) throughout. Hook names in Task 4
match every call site. `FinancialMode` and `resolveMode` (Task 5) in Tasks 6–10.

**Known risk.** The design is light-mode only and the portal requires both. Every
UI task ends with a dark-mode check, and Global Constraints forbids copying the
design's hex values — but this is the most likely thing to be got wrong.
