/**
 * Third-person pronouns for application copy.
 *
 * Driven by `TenantApplication['gender']`, which records gender rather than
 * pronouns and carries only two values — so anything unrecognised falls back
 * to they/them, which is never wrong about a real person.
 *
 * They/them takes plural verbs, which is why this module exposes verb
 * agreement rather than just the pronouns. Interpolating the subject alone
 * produces "Who they is".
 */
export interface Pronouns {
	/** she / he / they */
	subject: string
	/** her / him / them */
	object: string
	/** her / his / their */
	possessive: string
	/** they → true. Drives every verb form below. */
	plural: boolean
}

const SHE: Pronouns = {
	subject: 'she',
	object: 'her',
	possessive: 'her',
	plural: false,
}
const HE: Pronouns = {
	subject: 'he',
	object: 'him',
	possessive: 'his',
	plural: false,
}
const THEY: Pronouns = {
	subject: 'they',
	object: 'them',
	possessive: 'their',
	plural: true,
}

export function pronounsFor(
	gender: Nullable<TenantApplication['gender']> | undefined,
): Pronouns {
	if (gender === 'FEMALE') return SHE
	if (gender === 'MALE') return HE
	return THEY
}

export const isAre = (p: Pronouns) => (p.plural ? 'are' : 'is')
export const hasHave = (p: Pronouns) => (p.plural ? 'have' : 'has')

/**
 * Third-person s for a regular verb: "moves in" / "move in".
 *
 * Regular verbs only — pass the bare stem ("move", "pay", "stay", "get").
 * Irregulars have their own helpers above; add one rather than special-casing
 * here.
 */
export const verb = (p: Pronouns, base: string) =>
	p.plural ? base : `${base}s`

/** "she's applying" / "they're applying" */
export const contractedIs = (p: Pronouns) => (p.plural ? "'re" : "'s")

export const capitalise = (word: string) =>
	word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word
