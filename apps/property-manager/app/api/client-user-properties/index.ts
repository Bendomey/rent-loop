import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all client users (Members) for a particular property based on a query.
 */
const getClientUserProperties = async (
	props: FetchMultipleDataInputParams<FetchClientUserPropertyFilter>,
) => {
	try {
		const params =
			getQueryParams<FetchClientUserPropertyFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<ClientUserProperty>>
		>(`/v1/client-user-properties?${params.toString()}`)

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

export const useGetClientUserProperties = (
	query: FetchMultipleDataInputParams<FetchClientUserPropertyFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.CLIENT_USER_PROPERTIES, query],
		queryFn: () => getClientUserProperties(query),
	})

interface ClientUserPropertyLinkProps {
	property_id: string
	role: ClientUserProperty['role']
	client_user_ids: ClientUser['id'][]
}

/**
 * Link client user to property
 */
const clientUserPropertyLink = async ({
	property_id,
	role,
	client_user_ids,
}: ClientUserPropertyLinkProps) => {
	try {
		const response = await fetchClient<ApiResponse<ClientUserProperty>>(
			`/v1/properties/${property_id}/client-users:link`,
			{
				method: 'POST',
				body: JSON.stringify({ role, client_user_ids }),
			},
		)
		return response.parsedBody.data
	} catch (error) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}
export const useLinkClientUserProperty = () =>
	useMutation({ mutationFn: clientUserPropertyLink })

interface ClientUserPropertyUnlinkProps {
	property_id: string
	client_user_ids: ClientUser['id'][]
}

/**
 * Unlink client user from property
 */

const clientUserPropertyUnlink = async ({
	property_id,
	client_user_ids,
}: ClientUserPropertyUnlinkProps) => {
	try {
		await fetchClient<boolean>(
			`/v1/properties/${property_id}/client-users:unlink`,
			{
				method: 'DELETE',
				body: JSON.stringify({ client_user_ids }),
			},
		)
	} catch (error) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}
export const useUnlinkClientUserProperty = () =>
	useMutation({ mutationFn: clientUserPropertyUnlink })
