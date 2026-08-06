import dayjs from 'dayjs'
import { getDocsItems } from './checklist-docs'
import { getFinancialItems } from './checklist-financial'
import { getMoveInItems } from './checklist-move-in'
import { getTenantDetailItems } from './checklist-tenant-details'
import {
	type ChecklistItem,
	type ChecklistStep,
	type ChecklistStepState,
	isStepSatisfied,
	requiredItems,
} from './checklist-types'
import { getUnitItems } from './checklist-unit'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { toFirstUpperCase } from '~/lib/strings'

const TERM_UNIT: Record<string, string> = {
	DAILY: 'day',
	WEEKLY: 'week',
	MONTHLY: 'month',
	QUARTERLY: 'quarter',
	BIANNUALLY: 'half-year',
	ANNUALLY: 'year',
}

/**
 * "Needs charges created" — the first thing still outstanding, named.
 *
 * The label is only lower-cased when it starts with an ordinary word. "ID
 * number" has to stay as it is, or the note reads "Needs iD number".
 */
function missingNote(items: ChecklistItem[]): string | undefined {
	const first = requiredItems(items).find((item) => !item.done)
	if (!first) return undefined
	const acronym =
		first.label.slice(0, 2) === first.label.slice(0, 2).toUpperCase()
	const label = acronym
		? first.label
		: `${first.label.charAt(0).toLowerCase()}${first.label.slice(1)}`
	return `Needs ${label}`
}

function termNote(application: TenantApplication): string | undefined {
	const { desired_move_in_date, stay_duration, stay_duration_frequency } =
		application
	if (!desired_move_in_date || !stay_duration || !stay_duration_frequency)
		return undefined
	const unit = TERM_UNIT[stay_duration_frequency] ?? 'period'
	return `${dayjs(desired_move_in_date).format('D MMM YYYY')} · ${stay_duration} ${unit}${stay_duration === 1 ? '' : 's'}`
}

/**
 * What each step hands on to the next.
 *
 * These are not presentation choices — they are the preconditions the API
 * enforces. Financial setup needs the move-in date and stay duration because
 * charges:prepare returns 400 without them, so a row that let you tap into it
 * would only lead to a refused write.
 */
const DEPENDS_ON: Record<string, string[]> = {
	unit: [],
	tenant: [],
	'move-in': ['unit'],
	financial: ['move-in'],
	docs: ['financial'],
}

const LABELS: Record<string, string> = {
	unit: 'Select a unit',
	tenant: 'Add tenant details',
	'move-in': 'Move-in setup',
	financial: 'Financial setup',
	docs: 'Lease documents',
}

export interface ChecklistSource {
	key: string
	path: string
	items: ChecklistItem[]
	/** The fact to show once the step is finished. */
	doneNote?: string
	/**
	 * Set when a finished step has been invalidated from outside. Puts the row —
	 * and everything downstream of it — into attention.
	 */
	attentionNote?: string
}

export function getChecklistSources(
	application: TenantApplication,
): ChecklistSource[] {
	const unit = application.desired_unit
	const account = application.financial_account

	// A unit that was let to somebody else while this application sat open. The
	// step is still "finished" in the sense that a unit is chosen, but the choice
	// can no longer be honoured, which is exactly what attention is for.
	const unitTaken =
		application.status === 'TenantApplication.Status.InProgress' &&
		unit?.status === 'Unit.Status.Occupied'

	return [
		{
			key: 'unit',
			path: '',
			items: getUnitItems(application),
			doneNote: unit
				? `${unit.name} · ${toFirstUpperCase(unit.type.toLowerCase())}`
				: undefined,
			attentionNote: unitTaken ? 'Now occupied · pick another' : undefined,
		},
		{
			key: 'tenant',
			path: '/tenant-details',
			items: getTenantDetailItems(application),
			doneNote:
				[application.first_name, application.last_name]
					.filter(Boolean)
					.join(' ') || undefined,
		},
		{
			key: 'move-in',
			path: '/move-in',
			items: getMoveInItems(application),
			doneNote: termNote(application),
		},
		{
			key: 'financial',
			path: '/financial',
			items: getFinancialItems(application),
			doneNote: account
				? `${account.charge_count} charges · ${formatAmount(
						convertPesewasToCedis(account.total_charged),
						account.currency,
					)}`
				: undefined,
		},
		{
			key: 'docs',
			path: '/docs',
			items: getDocsItems(application),
			doneNote: application.lease_agreement_document_mode
				? 'Agreement signed'
				: undefined,
		},
	]
}

/**
 * Resolve every row's state in one pass.
 *
 * Order matters: a step reads the states of the steps it depends on, so the
 * sources must stay in dependency order. Blocked is computed here and never
 * stored — if the server would refuse the write, the rail refuses the tap.
 */
export function buildChecklistSteps(
	application: TenantApplication,
	baseUrl: string,
): ChecklistStep[] {
	const approved = application.status === 'TenantApplication.Status.Completed'
	const sources = getChecklistSources(application)
	const resolved = new Map<string, ChecklistStep>()

	for (const source of sources) {
		const href = `${baseUrl}${source.path}`
		const required = requiredItems(source.items)
		const complete = source.items.length > 0 && required.every((i) => i.done)
		const started = source.items.some((item) => item.done)

		// The nearest unmet dependency, and only that one. "Needs financial setup",
		// never "Needs move-in setup and financial setup".
		const blocker = (DEPENDS_ON[source.key] ?? [])
			.map((key) => resolved.get(key))
			.find((step) => step && !isStepSatisfied(step.state))

		let state: ChecklistStepState
		let note: string | undefined

		if (source.attentionNote) {
			state = 'attention'
			note = source.attentionNote
		} else if (blocker) {
			state = 'blocked'
			note = `Needs ${blocker.label.toLowerCase()}`
		} else if (complete) {
			state = approved ? 'locked' : 'done'
			note = source.doneNote
		} else if (started) {
			state = 'progress'
			note = missingNote(source.items)
		} else {
			state = 'todo'
		}

		resolved.set(source.key, {
			key: source.key,
			label: LABELS[source.key] ?? source.key,
			href,
			state,
			note,
			blockerHref: blocker?.href,
			items: source.items,
		})
	}

	return sources.map((source) => resolved.get(source.key) as ChecklistStep)
}
