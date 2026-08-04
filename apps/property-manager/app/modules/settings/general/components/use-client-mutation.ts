import { toast } from 'sonner'
import { useUpdateClient } from '~/api/clients'
import { getErrorMessage } from '~/lib/error-messages'

/**
 * Every edit on General Settings PATCHes the same client record, so they all
 * share this: fire the mutation, toast on either outcome, and let the caller
 * close its dialog and refetch on success.
 */
export function useClientMutation(
	successMessage: string,
	onSuccess: (updatedClient?: Client) => void,
) {
	const { mutate, isPending } = useUpdateClient()

	const submit = (data: Parameters<typeof mutate>[0]) => {
		mutate(data, {
			onSuccess: (updatedClient) => {
				toast.success(successMessage)
				onSuccess(updatedClient as Client | undefined)
			},
			onError: (e: unknown) => {
				toast.error(
					getErrorMessage(
						e instanceof Error ? e.message : 'Unknown error',
						'Something went wrong. Please try again.',
					),
				)
			},
		})
	}

	return { submit, isPending }
}

export const subTypeOptions: Array<{
	label: string
	value: 'PROPERTY_MANAGER' | 'DEVELOPER' | 'AGENCY'
}> = [
	{ label: 'Property Manager', value: 'PROPERTY_MANAGER' },
	{ label: 'Developer', value: 'DEVELOPER' },
	{ label: 'Agency', value: 'AGENCY' },
]

export const idTypeOptions = [
	{ label: 'National ID', value: 'NATIONAL_ID' },
	{ label: 'Passport', value: 'PASSPORT' },
	{ label: "Driver's License", value: 'DRIVERS_LICENSE' },
] as const

export function getSubTypeLabel(subType: Client['sub_type'] | undefined) {
	if (!subType) return undefined
	return subType
		.toLowerCase()
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase())
}
