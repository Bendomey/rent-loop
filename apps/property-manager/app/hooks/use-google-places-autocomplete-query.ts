import { useQuery } from '@tanstack/react-query'

interface Params {
	enabled: boolean
	query: string
	sessionToken?: google.maps.places.AutocompleteSessionToken | null
	region?: string
}

export default function useGooglePlacesAutocompleteQuery({
	enabled,
	query,
	sessionToken,
	region,
}: Params) {
	return useQuery({
		enabled: query?.length > 0 && enabled,
		queryFn: async () => {
			const { suggestions } =
				await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
					{
						input: query,
						sessionToken: sessionToken ?? undefined,
						region,
					},
				)

			return suggestions.reduce<Array<google.maps.places.PlacePrediction>>(
				(results, suggestion) => {
					if (suggestion.placePrediction) {
						results.push(suggestion.placePrediction)
					}

					return results
				},
				[],
			)
		},
		queryKey: ['googlePlacesSearch', { query }],
	})
}
