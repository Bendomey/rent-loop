import { useLoadScript, type LoadScriptNextProps } from '@react-google-maps/api'
import { useCallback, useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import z from 'zod'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from './ui/command'
import { useDebounce } from '~/hooks/use-debounce'
import useGooglePlacesAutocompleteQuery from '~/hooks/use-google-places-autocomplete-query'

export const AddressSchema = z.object({
	addressSearch: z
		.string({ error: 'Address is required' })
		.min(5, 'Please enter a valid address'),
	address: z
		.string({ error: 'Address is required' })
		.min(5, 'Please enter a valid address'),
	city: z
		.string({ error: 'City is required' })
		.min(2, 'Please enter a valid address'),
	region: z
		.string({ error: 'Region is required' })
		.min(2, 'Please enter a valid address'),
	country: z
		.string({ error: 'Country is required' })
		.min(2, 'Please enter a valid address'),
	latitude: z.number().refine((val) => !isNaN(val), {
		message: 'Please enter a valid latitude',
	}),
	longitude: z.number().refine((val) => !isNaN(val), {
		message: 'Please enter a valid longitude',
	}),
})

export type AddressInputSchema = z.infer<typeof AddressSchema>

const googleApiLibraries: LoadScriptNextProps['libraries'] = ['places']

export function AddressInput() {
	const { isLoaded } = useLoadScript({
		googleMapsApiKey: window.ENV.GOOGLE_MAPS_API_KEY,
		libraries: googleApiLibraries,
	})
	const { setValue, watch } = useFormContext<AddressInputSchema>()
	const [sessionToken, setSessionToken] =
		useState<google.maps.places.AutocompleteSessionToken | null>(null)

	const debouncedSearch = useDebounce({
		delay: 250,
		value: watch('addressSearch'),
	})
	const {
		data: placePredictions,
		isFetching: isPending,
		isError,
	} = useGooglePlacesAutocompleteQuery({
		enabled:
			sessionToken !== null && watch('addressSearch') !== debouncedSearch,
		query: debouncedSearch,
		sessionToken,
		region: 'gh',
	})

	const resetSessionToken = useCallback(() => {
		setSessionToken(new google.maps.places.AutocompleteSessionToken())
	}, [])

	useEffect(() => {
		if (isLoaded) {
			resetSessionToken()
		}
	}, [isLoaded, resetSessionToken])

	const handleSelectedLocationChange = (place: google.maps.places.Place) => {
		if (place.addressComponents) {
			// Get each component of the address from the place details,
			// and then fill-in the corresponding field on the form.
			// place.addressComponents are google.maps.GeocoderAddressComponent objects
			// which are documented at https://developers.google.com/maps/documentation/javascript/geocoding#GeocodingAddressTypes
			for (const component of place.addressComponents) {
				const componentType = component.types[0]

				switch (componentType) {
					case 'locality':
						setValue('city', component.longText ?? component.shortText ?? '', {
							shouldDirty: true,
							shouldValidate: true,
						})
						break

					case 'administrative_area_level_1': {
						setValue(
							'region',
							component.longText ?? component.shortText ?? '',
							{ shouldDirty: true, shouldValidate: true },
						)
						break
					}

					case 'country': {
						setValue(
							'country',
							component.longText ?? component.shortText ?? '',
							{ shouldDirty: true, shouldValidate: true },
						)
						break
					}
					default:
						break
				}
			}
		}

		if (place.location?.lat()) {
			setValue('latitude', place.location?.lat(), {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (place.location?.lng()) {
			setValue('longitude', place.location?.lng(), {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
	}

	const handleSelectedPlace = async (
		prediction: google.maps.places.PlacePrediction,
	) => {
		setValue('addressSearch', prediction.text.text, {
			shouldDirty: true,
			shouldValidate: true,
		})

		const place = prediction.toPlace()
		await place.fetchFields({
			fields: ['formattedAddress', 'addressComponents', 'location'],
		})
		setValue('address', prediction.text.text, {
			shouldDirty: true,
			shouldValidate: true,
		})
		handleSelectedLocationChange(place)
	}

	const isOpened = isPending || isError || Boolean(placePredictions)

	return (
		<Command className="w-full rounded-lg border bg-white" shouldFilter={false}>
			<CommandInput
				value={watch('addressSearch') || ''}
				placeholder="Search by address"
				onValueChange={(value) => {
					setValue('addressSearch', value, { shouldDirty: true })
				}}
			/>

			{isOpened ? (
				<CommandList>
					{isPending ? (
						<div className="text-muted-foreground p-4 text-center text-sm">
							Loading...
						</div>
					) : isError ? (
						<CommandEmpty>Error fetching results</CommandEmpty>
					) : placePredictions?.length === 0 ? (
						<CommandEmpty>No results found.</CommandEmpty>
					) : (
						<CommandGroup>
							{placePredictions?.map((prediction) => (
								<CommandItem
									key={prediction.placeId}
									value={prediction.placeId}
									onSelect={() => handleSelectedPlace(prediction)}
								>
									{prediction.text.text}
								</CommandItem>
							))}
						</CommandGroup>
					)}
				</CommandList>
			) : null}
		</Command>
	)
}
