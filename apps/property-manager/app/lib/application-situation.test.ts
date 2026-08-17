import { expect, test } from 'vitest'
import {
	type StepState,
	leadStepFor,
	leadStepIndex,
	resolveSituation,
} from './application-situation'

const IN_PROGRESS = 'TenantApplication.Status.InProgress' as const
const COMPLETED = 'TenantApplication.Status.Completed' as const
const CANCELLED = 'TenantApplication.Status.Cancelled' as const

const steps = (...s: StepState[]) => s

test('an approved application is a record, whatever its steps say', () => {
	expect(
		resolveSituation({
			status: COMPLETED,
			stepStates: steps('locked', 'locked', 'locked', 'locked', 'locked'),
			canApprove: true,
		}),
	).toBe('approved')
})

test('a cancelled application is closed out', () => {
	expect(
		resolveSituation({
			status: CANCELLED,
			stepStates: steps('done', 'done', 'todo', 'blocked', 'blocked'),
			canApprove: false,
		}),
	).toBe('cancelled')
})

// A unit let to someone else can leave every field still filled in, so
// attention has to outrank ready or the page would offer to approve an
// application that cannot proceed.
test('attention outranks ready', () => {
	expect(
		resolveSituation({
			status: IN_PROGRESS,
			stepStates: steps('attention', 'done', 'done', 'done', 'done'),
			canApprove: true,
		}),
	).toBe('attention')
})

test('everything done and approvable is ready', () => {
	expect(
		resolveSituation({
			status: IN_PROGRESS,
			stepStates: steps('done', 'done', 'done', 'done', 'done'),
			canApprove: true,
		}),
	).toBe('ready')
})

test('at most one step satisfied is still fresh', () => {
	expect(
		resolveSituation({
			status: IN_PROGRESS,
			stepStates: steps('done', 'progress', 'todo', 'blocked', 'blocked'),
			canApprove: false,
		}),
	).toBe('fresh')
})

test('more than one step satisfied is midway', () => {
	expect(
		resolveSituation({
			status: IN_PROGRESS,
			stepStates: steps('done', 'done', 'done', 'progress', 'blocked'),
			canApprove: false,
		}),
	).toBe('midway')
})

test('the lead is the step that needs attention', () => {
	expect(
		leadStepIndex(steps('done', 'attention', 'progress', 'todo', 'todo')),
	).toBe(1)
})

test('otherwise the lead is the step in progress', () => {
	expect(
		leadStepIndex(steps('done', 'done', 'progress', 'todo', 'blocked')),
	).toBe(2)
})

test('otherwise the lead is the first step not started', () => {
	expect(leadStepIndex(steps('done', 'done', 'todo', 'todo', 'blocked'))).toBe(
		2,
	)
})

// Blocked steps are never the lead — tapping into one only leads to a write
// the server refuses.
test('a blocked step is never the lead', () => {
	expect(
		leadStepIndex(steps('done', 'done', 'done', 'blocked', 'blocked')),
	).toBeNull()
})

test('nothing to do leaves no lead', () => {
	expect(
		leadStepIndex(steps('done', 'done', 'done', 'done', 'done')),
	).toBeNull()
})

// Lease documents are vacuously approvable until an agreement is attached, so
// an application can be `ready` while a step is still `todo`. Pointing at that
// step would have the page say "Everything's done" and highlight an unfinished
// step in the same breath.
test('a ready application has no next step, even with one unstarted', () => {
	expect(
		leadStepFor('ready', steps('done', 'done', 'done', 'done', 'todo')),
	).toBeNull()
})

test('an approved or declined application has no next step', () => {
	expect(
		leadStepFor(
			'approved',
			steps('locked', 'locked', 'locked', 'locked', 'todo'),
		),
	).toBeNull()
	expect(
		leadStepFor(
			'cancelled',
			steps('done', 'todo', 'todo', 'blocked', 'blocked'),
		),
	).toBeNull()
})

test('a live application still gets its next step', () => {
	expect(
		leadStepFor('midway', steps('done', 'done', 'progress', 'todo', 'blocked')),
	).toBe(2)
	expect(
		leadStepFor(
			'attention',
			steps('attention', 'done', 'blocked', 'blocked', 'blocked'),
		),
	).toBe(0)
	expect(
		leadStepFor('fresh', steps('done', 'todo', 'todo', 'blocked', 'blocked')),
	).toBe(1)
})
