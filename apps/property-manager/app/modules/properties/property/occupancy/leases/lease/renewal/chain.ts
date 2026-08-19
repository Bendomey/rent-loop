import { lastDayOfTerm } from '../../../applications/application/move-in/term'

/**
 * One contractual term in a tenancy.
 *
 * `state` is what the term IS — running, starting later, ended, cancelled. It
 * is deliberately separate from which term you are LOOKING AT, which the strip
 * marks itself. Conflating the two made a finished term you happened to be
 * viewing read as the current one.
 */
export interface ChainTerm {
	id: string
	code: string
	from: Date
	to: Date
	rent: number
	unitName: string
	status: string
	state: 'current' | 'next' | 'ended' | 'cancelled'
	/** True when this term moved the tenant to a different room. */
	moved: boolean
}

const ENDED = new Set(['Lease.Status.Completed', 'Lease.Status.Terminated'])

const endOf = (lease: Lease) =>
	lease.move_out_date
		? new Date(lease.move_out_date)
		: new Date(lease.move_in_date)

const stateOf = (lease: Lease, now: Date): ChainTerm['state'] => {
	if (lease.status === 'Lease.Status.Cancelled') return 'cancelled'
	const from = new Date(lease.move_in_date)
	const to = endOf(lease)
	if (now >= from && now < to && !ENDED.has(lease.status)) return 'current'
	if (from > now) return 'next'
	return 'ended'
}

/**
 * The chain of terms containing `leaseId`, oldest first.
 *
 * Built client-side by walking `parent_lease_id` across the tenant's leases
 * rather than asking the API for a chain: the tenant's leases are one call the
 * page already has reason to make, and a chain endpoint would be a second way
 * to ask the same question.
 *
 * Only the connected run containing this lease is returned — a tenant renting
 * two unrelated rooms has two chains, and mixing them would invent a history
 * that never happened.
 */
export function buildChain(
	leases: Lease[],
	leaseId: string,
	now: Date = new Date(),
): ChainTerm[] {
	const byId = new Map(leases.map((lease) => [lease.id, lease]))
	const childrenOf = new Map<string, Lease[]>()
	for (const lease of leases) {
		if (!lease.parent_lease_id) continue
		const siblings = childrenOf.get(lease.parent_lease_id) ?? []
		siblings.push(lease)
		childrenOf.set(lease.parent_lease_id, siblings)
	}

	if (!byId.has(leaseId)) return []

	// Sweep the connected run containing this lease — up through parents, down
	// through children — rather than walking in one direction. A cancelled
	// renewal is part of the history but never the parent of another, so a
	// directional walk would stop at it and lose everything after.
	const inChain = new Set<string>([leaseId])
	const queue: string[] = [leaseId]
	while (queue.length > 0) {
		const id = queue.shift() as string
		const lease = byId.get(id)
		if (!lease) continue

		const neighbours: string[] = []
		if (lease.parent_lease_id) neighbours.push(lease.parent_lease_id)
		for (const child of childrenOf.get(id) ?? []) neighbours.push(child.id)

		for (const next of neighbours) {
			if (inChain.has(next) || !byId.has(next)) continue
			inChain.add(next)
			queue.push(next)
		}
	}

	const ordered = leases.filter((lease) => inChain.has(lease.id))

	const terms = ordered
		.map<ChainTerm>((lease) => ({
			id: lease.id,
			code: lease.code,
			from: new Date(lease.move_in_date),
			to: lastDayOfTerm(endOf(lease)),
			rent: lease.rent_fee,
			unitName: lease.unit?.name ?? '',
			status: lease.status,
			state: stateOf(lease, now),
			moved: false,
		}))
		.sort((a, b) => a.from.getTime() - b.from.getTime())

	// A move is only legible against the term before it that actually ran.
	let previousUnit: string | null = null
	for (const term of terms) {
		if (term.state === 'cancelled') continue
		if (previousUnit !== null && term.unitName !== previousUnit)
			term.moved = true
		previousUnit = term.unitName
	}

	return terms
}

/** Terms that actually ran — a cancelled one is history, not a term served. */
export const livingTerms = (chain: ChainTerm[]) =>
	chain.filter((term) => term.state !== 'cancelled')

/**
 * How long the tenant has been here, measured to today rather than to the end
 * of a term still running.
 */
export function tenancyLength(chain: ChainTerm[], now: Date = new Date()) {
	const live = livingTerms(chain)
	const first = live[0]
	if (!first) return ''
	const months = Math.max(
		0,
		Math.round((now.getTime() - first.from.getTime()) / 2.63e9),
	)
	if (months < 24) return `${months} months so far`
	const years = Math.floor(months / 12)
	const rest = months % 12
	return rest === 0
		? `${years} years so far`
		: `${years} years ${rest} months so far`
}
