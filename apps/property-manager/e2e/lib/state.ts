/**
 * The handoff between global setup and the specs.
 *
 * Playwright runs global setup in a separate process from the workers, so the
 * resolved run context (which workspace, which property, which run id) is
 * written to disk rather than shared in memory.
 */
import fs from 'node:fs'
import path from 'node:path'

export interface RunState {
	runId: string
	token: string
	clientId: string
	clientName: string
	propertyId: string
	propertyName: string
	blockId: string
}

const STATE_FILE = path.join(import.meta.dirname, '..', '.e2e-state.json')
export const STORAGE_STATE = path.join(
	import.meta.dirname,
	'..',
	'.e2e-storage.json',
)

export function writeRunState(state: RunState): void {
	fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

export function readRunState(): RunState {
	if (!fs.existsSync(STATE_FILE)) {
		throw new Error(
			'No run state found. Global setup must run before the specs — ' +
				'run the suite via `yarn e2e`, not by invoking a spec directly.',
		)
	}
	return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as RunState
}

/**
 * Every entity a case creates carries the run id, so residue left in a shared
 * database is always attributable and never collides with a previous run.
 * Units in particular cannot be reused: approving an application occupies a
 * unit permanently.
 */
export function tag(runId: string, label: string): string {
	return `e2e-${runId}-${label}`
}

/**
 * A phone number unique to this run. Approval creates a Tenant, and
 * `tenants.phone` carries a unique index — reusing a number across runs fails
 * on the second approval rather than on the assertion, which reads as a
 * mysterious 400 unless you know to look for it.
 */
export function uniquePhone(runId: string, seq: number): string {
	// Must be a *structurally valid* Ghanaian mobile, not merely unique. The
	// forms validate with react-phone-number-input, and an invalid number does
	// not surface as a field error you can see from a test — the wizard just
	// refuses to advance, which reads like a broken selector.
	//
	// Ghana mobiles are 9 national digits beginning 2 or 5, so this emits
	// +233 54 XXXXXXX and derives the last 7 from the run id. Run ids are
	// base36, so digit-stripping them (the obvious approach) yields too few
	// digits and a number starting 00.
	let hash = 0
	for (const ch of `${runId}:${seq}`) {
		hash = (hash * 31 + ch.charCodeAt(0)) % 10_000_000
	}
	return `+23354${String(hash).padStart(7, '0')}`
}
