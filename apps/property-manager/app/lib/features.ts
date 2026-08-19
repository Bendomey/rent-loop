/**
 * Features are jsonb on the API, so values arrive as numbers or booleans even
 * though `PropertyUnit` types them as strings. The unit forms validate them
 * with `z.record(z.string(), z.string())`, and a non-string value fails that
 * check with no visible error — the submit button just stops working.
 */
export function toStringFeatures(
	features: Maybe<Record<string, unknown>>,
): StringRecord {
	if (!features) return {}

	return Object.fromEntries(
		Object.entries(features)
			.filter(([, value]) => value !== null && value !== undefined)
			.map(([key, value]) => [
				key,
				typeof value === 'string' ? value : JSON.stringify(value),
			]),
	)
}
