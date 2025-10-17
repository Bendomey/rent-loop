import { type DehydratedState } from '@tanstack/query-core'

import merge from 'deepmerge'
import { useMatches } from 'react-router'

const useDehydratedState = (): DehydratedState => {
	const matches = useMatches()

	const dehydratedState = matches
		.map((match) => (match.loaderData as any)?.dehydratedState)
		.filter(Boolean)

	return dehydratedState.length
		? dehydratedState.reduce(
				(accumulator, currentValue) => merge(accumulator, currentValue),
				{},
			)
		: {
				mutations: [],
				queries: [],
			}
}

export { useDehydratedState }
