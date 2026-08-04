import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient } from '~/lib/transport'

// ─── Fetch ────────────────────────────────────────────────────────────────────

const fetchLeaseAgreementDocument = async (
	clientId: string,
	propertyId: string,
	leaseId: string,
) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseAgreementDocument>>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/leases/${leaseId}/agreement-documents`,
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useLeaseAgreementDocument = (
	clientId: string,
	propertyId: string,
	leaseId: string,
	enabled = true,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.LEASE_AGREEMENT_DOCUMENT,
			clientId,
			propertyId,
			leaseId,
		],
		queryFn: () => fetchLeaseAgreementDocument(clientId, propertyId, leaseId),
		enabled: enabled && !!clientId && !!propertyId && !!leaseId,
		retry: false,
	})

// ─── Create ───────────────────────────────────────────────────────────────────

export interface CreateLeaseAgreementDocumentInput {
	client_id: string
	property_id: string
	lease_id: string
	mode: 'MANUAL' | 'ONLINE'
	document_id?: string | null
	document_url?: string | null
}

const createLeaseAgreementDocument = async ({
	client_id,
	property_id,
	lease_id,
	...body
}: CreateLeaseAgreementDocumentInput) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseAgreementDocument>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/leases/${lease_id}/agreement-documents`,
			{ method: 'POST', body: JSON.stringify(body) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useCreateLeaseAgreementDocument = () =>
	useMutation({ mutationFn: createLeaseAgreementDocument })

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdateLeaseAgreementDocumentInput {
	client_id: string
	property_id: string
	lease_id: string
	mode?: 'MANUAL' | 'ONLINE'
	document_id?: string | null
	document_url?: string | null
}

const updateLeaseAgreementDocument = async ({
	client_id,
	property_id,
	lease_id,
	...body
}: UpdateLeaseAgreementDocumentInput) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseAgreementDocument>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/leases/${lease_id}/agreement-documents`,
			{ method: 'PATCH', body: JSON.stringify(body) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useUpdateLeaseAgreementDocument = () =>
	useMutation({ mutationFn: updateLeaseAgreementDocument })

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteLeaseAgreementDocument = async ({
	client_id,
	property_id,
	lease_id,
}: {
	client_id: string
	property_id: string
	lease_id: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${client_id}/properties/${property_id}/leases/${lease_id}/agreement-documents`,
			{ method: 'DELETE' },
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useDeleteLeaseAgreementDocument = () =>
	useMutation({ mutationFn: deleteLeaseAgreementDocument })

// ─── Finalize ─────────────────────────────────────────────────────────────────

const finalizeLeaseAgreementDocument = async ({
	client_id,
	property_id,
	lease_id,
}: {
	client_id: string
	property_id: string
	lease_id: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseAgreementDocument>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/leases/${lease_id}/agreement-documents/finalize`,
			{ method: 'POST' },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useFinalizeLeaseAgreementDocument = () =>
	useMutation({ mutationFn: finalizeLeaseAgreementDocument })

// ─── Revert to draft ──────────────────────────────────────────────────────────

const revertLeaseAgreementDocumentToDraft = async ({
	client_id,
	property_id,
	lease_id,
}: {
	client_id: string
	property_id: string
	lease_id: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseAgreementDocument>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/leases/${lease_id}/agreement-documents/draft`,
			{ method: 'POST' },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useRevertLeaseAgreementDocumentToDraft = () =>
	useMutation({ mutationFn: revertLeaseAgreementDocumentToDraft })
