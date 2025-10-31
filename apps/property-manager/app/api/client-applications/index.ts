import { fetchServer } from '~/lib/transport'

export interface CreateClientApplicationInput {
	address: string
	city: string
	contact_email: string
	contact_name: string
	contact_phone_number: string
	country: string
	date_of_birth: string
	description: Maybe<string>
	id_document_url: Maybe<string>
	id_expiry: Maybe<string>
	id_number: Maybe<string>
	id_type: Maybe<ClientApplication['id_type']>
	latitude: number
	logo_url: Maybe<string>
	longitude: number
	name: string
	region: string
	registration_number: string
	sub_type: ClientApplication['sub_type']
	support_email: string
	support_phone: string
	type: ClientApplication['type']
	website_url: Maybe<string>
}

export const applyAsAClient = async (
	props: CreateClientApplicationInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<ClientApplication>>(
			`${apiConfig?.baseUrl}/v1/clients/apply`,
			{
				method: 'POST',
				body: JSON.stringify(props),
				...(apiConfig ? apiConfig : {}),
			},
		)

		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}
