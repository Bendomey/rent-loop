import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

/**
 * Verify a signing token and return document + signer info.
 * Public — the token itself is the authorization.
 */
export const verifySigningToken = async (
	token: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<SigningToken>>(
			`${apiConfig.baseUrl}/v1/signing/${token}/verify?populate=Document&populate=TenantApplication`,
			{ method: 'GET', isUnAuthorizedRequest: true },
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

/**
 * Generate a signing token for a document signer.
 * Authenticated — requires ADMIN or OWNER role.
 */
export interface GenerateSigningTokenInput {
	client_id: string
	property_id: string
	document_id: string
	role: 'TENANT' | 'PM_WITNESS' | 'TENANT_WITNESS'
	tenant_application_id?: string
	lease_id?: string
	signer_name?: string
	signer_email?: string
	signer_phone?: string
}

const generateSigningToken = async ({
	client_id,
	property_id,
	...body
}: GenerateSigningTokenInput) => {
	try {
		const response = await fetchClient<ApiResponse<AdminSigningToken>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/signing-tokens`,
			{
				method: 'POST',
				body: JSON.stringify(body),
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

export const useGenerateSigningToken = () =>
	useMutation({
		mutationFn: generateSigningToken,
	})

/**
 * Submit a signature using a signing token.
 * Public — the token itself is the authorization.
 */
export interface SignDocumentInput {
	token: string
	signature_url: string
	signer_name?: string
}

const signDocument = async ({ token, ...body }: SignDocumentInput) => {
	try {
		const response = await fetchClient<ApiResponse<RentloopDocumentSignature>>(
			`/v1/signing/${token}/sign`,
			{
				method: 'POST',
				body: JSON.stringify(body),
				isUnAuthorizedRequest: true,
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

export const useSignDocument = () =>
	useMutation({
		mutationFn: signDocument,
	})

/**
 * Submit a signature directly as a property manager (no token required).
 * Authenticated — requires ADMIN or OWNER role.
 */
export interface SignDocumentDirectInput {
	client_id: string
	property_id: string
	document_id: string
	signature_url: string
	tenant_application_id?: string
	lease_id?: string
}

const signDocumentDirect = async ({
	client_id,
	property_id,
	...body
}: SignDocumentDirectInput) => {
	try {
		const response = await fetchClient<ApiResponse<RentloopDocumentSignature>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/signing`,
			{
				method: 'POST',
				body: JSON.stringify(body),
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

export const useSignDocumentDirect = () =>
	useMutation({
		mutationFn: signDocumentDirect,
	})

/**
 * Update signer details on an existing signing token.
 */
export interface UpdateSigningTokenInput {
	client_id: string
	property_id: string
	signing_token_id: string
	signer_name?: string
	signer_email?: string
	signer_phone?: string
}

const updateSigningToken = async ({
	client_id,
	property_id,
	signing_token_id,
	...body
}: UpdateSigningTokenInput) => {
	try {
		const response = await fetchClient<ApiResponse<AdminSigningToken>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/signing-tokens/${signing_token_id}`,
			{
				method: 'PATCH',
				body: JSON.stringify(body),
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

export const useUpdateSigningToken = () =>
	useMutation({
		mutationFn: updateSigningToken,
	})

/**
 * Resend the signing notification for an existing token.
 */
const resendSigningToken = async ({
	client_id,
	property_id,
	signing_token_id,
}: {
	client_id: string
	property_id: string
	signing_token_id: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<AdminSigningToken>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/signing-tokens/${signing_token_id}/resend`,
			{ method: 'POST' },
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

export const useResendSigningToken = () =>
	useMutation({
		mutationFn: resendSigningToken,
	})

/**
 * Fetch signing tokens filtered by document and tenant application.
 */
const fetchSigningTokens = async (
	clientId: string,
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchSigningTokenFilter>,
) => {
	try {
		const params = getQueryParams<FetchSigningTokenFilter>(query)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<AdminSigningToken>>
		>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/signing-tokens?${params.toString()}`,
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

export const useSigningTokens = (
	clientId: string,
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchSigningTokenFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.SIGNING_TOKENS, clientId, propertyId, query],
		queryFn: () => fetchSigningTokens(clientId, propertyId, query),
		enabled: !!propertyId && !!clientId,
	})
