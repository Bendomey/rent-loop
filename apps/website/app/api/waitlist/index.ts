import { fetchClient } from '~/lib/transport'

interface CreateWaitlistEntryInput {
	fullName: string
	phoneNumber: string
	email?: string
}

export const createWaitlistEntry = async (input: CreateWaitlistEntryInput) => {
	try {
		const response = await fetchClient<{
			data: {
				id: string
				full_name: string
				phone_number: string
				email: string
			}
		}>('/v1/waitlist', {
			method: 'POST',
			isUnAuthorizedRequest: true,
			body: JSON.stringify({
				full_name: input.fullName,
				phone_number: input.phoneNumber,
				email: input.email,
			}),
		})
		return response.parsedBody
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(
				body.errors?.message || 'Something went wrong. Please try again.',
			)
		}
		if (error instanceof Error) {
			throw error
		}
		throw new Error('Something went wrong. Please try again.')
	}
}
