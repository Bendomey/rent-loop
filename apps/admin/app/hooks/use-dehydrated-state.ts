import { type DehydratedState } from '@tanstack/query-core'

import merge from 'deepmerge'
import { useMatches } from 'react-router'

const useDehydratedState = (): DehydratedState => {
	const matches = useMatches()

	const dehydratedState = matches.flatMap((match) => {
		const v = (match.loaderData as any)?.dehydratedState
		return v ? [v] : []
	})

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
