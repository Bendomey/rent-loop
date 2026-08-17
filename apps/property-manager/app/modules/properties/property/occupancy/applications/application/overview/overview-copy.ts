import type {
	ApplicationSituation,
	StepState,
} from '~/lib/application-situation'
import {
	type Pronouns,
	capitalise,
	contractedIs,
	isAre,
	verb,
} from '~/lib/pronouns'

export interface StepCopy {
	title: string
	what: string
}

/**
 * The hub's voice, keyed by the same step keys `getChecklistSources` uses.
 *
 * Deliberately not in `checklist-steps.ts`: the rail says "Select a unit" in
 * four words because it is a one-line row, and the hub says "The unit she
 * wants" because it is a card with room to explain itself. Coupling them would
 * force one of the two to read badly.
 */
export function stepCopyFor(
	p: Pronouns,
	firstName: string,
): Record<string, StepCopy> {
	const they = p.subject
	const them = p.object

	return {
		unit: {
			title: `The unit ${they} ${verb(p, 'want')}`,
			what: `Which unit ${they}${contractedIs(p)} applying for, and whether it’s still free.`,
		},
		tenant: {
			title: `Who ${they} ${isAre(p)}`,
			what: `${firstName}’s contact details and proof of ID.`,
		},
		'move-in': {
			title: `When ${they} ${verb(p, 'move')} in`,
			what: `The date ${they} ${verb(p, 'take')} the keys, and how long ${they}${contractedIs(p)} staying.`,
		},
		financial: {
			title: 'Rent & payments',
			what: `What ${they} ${verb(p, 'pay')}, what ${they} ${verb(p, 'pay')} at move-in, and how often ${they}${contractedIs(p)} billed.`,
		},
		docs: {
			title: 'Lease papers',
			what: `The agreement, signed by ${them} and by you.`,
		},
	}
}

export interface LeadCopy {
	eyebrow: string
	title: string
	body: string
}

/** What the step-card button says, by state. Null means the row is not tappable. */
export const STEP_CTA: Record<StepState, string | null> = {
	done: 'Change',
	locked: 'View',
	progress: 'Carry on',
	todo: 'Start',
	blocked: null,
	attention: 'Fix this',
}

export const SITUATION_LABEL: Record<ApplicationSituation, string> = {
	fresh: 'Just came in',
	midway: 'Part way through',
	attention: 'Something needs you',
	ready: 'Ready to approve',
	approved: 'Approved',
	cancelled: 'Declined',
}

const EYEBROW: Record<ApplicationSituation, string> = {
	fresh: 'Do this next',
	midway: 'Do this next',
	attention: 'Needs you',
	ready: 'Last thing',
	approved: 'All done',
	cancelled: 'Closed',
}

/**
 * The sentence at the top of the page — one named action, in plain words, with
 * the reason behind it.
 */
export function leadCopyFor(
	situation: ApplicationSituation,
	p: Pronouns,
	firstName: string,
	leadTitle: string | null,
	unitName: string | null,
): LeadCopy {
	const They = capitalise(p.subject)
	const their = p.possessive

	if (situation === 'approved')
		return {
			eyebrow: EYEBROW.approved,
			title: `${firstName} is now a tenant`,
			body: `Everything from here — ${their} bills, ${their} payments, ${their} repairs — happens on the lease.`,
		}

	if (situation === 'cancelled')
		return {
			eyebrow: EYEBROW.cancelled,
			title: 'This application was declined',
			body: `Nothing here can change now. ${capitalise(their)} details are kept for the record.`,
		}

	if (situation === 'attention')
		return {
			eyebrow: EYEBROW.attention,
			title: unitName
				? `${unitName} has been let to someone else`
				: `The unit ${firstName} wanted is gone`,
			body: `${They} can’t have it. Pick another unit and the rest of the application carries over.`,
		}

	if (situation === 'ready')
		return {
			eyebrow: EYEBROW.ready,
			title: `Everything’s done — approve ${p.object}`,
			body: `Approving turns this into a live lease. ${capitalise(their)} bills start going out on the dates you set, and the unit is marked occupied.`,
		}

	return {
		eyebrow: EYEBROW.fresh,
		title: leadTitle ?? `Carry on with ${firstName}’s application`,
		body: `Pick up where you left off. You can do the steps in any order that’s possible.`,
	}
}
