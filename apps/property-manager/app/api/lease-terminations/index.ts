import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

const BASE = (clientId: string, propertyId: string, leaseId: string) =>
	`/v1/admin/clients/${clientId}/properties/${propertyId}/leases/${leaseId}/terminations`

const getLeaseTerminations = async (
	clientId: string,
	propertyId: string,
	leaseId: string,
	props: FetchMultipleDataInputParams<FetchLeaseTerminationFilter>,
) => {
	try {
		const params = getQueryParams<FetchLeaseTerminationFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<LeaseTermination>>
		>(`${BASE(clientId, propertyId, leaseId)}?${params.toString()}`)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useGetLeaseTerminations = (
	clientId: string,
	propertyId: string,
	leaseId: string,
	query: FetchMultipleDataInputParams<FetchLeaseTerminationFilter>,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.LEASE_TERMINATIONS,
			clientId,
			propertyId,
			leaseId,
			query,
		],
		queryFn: () => getLeaseTerminations(clientId, propertyId, leaseId, query),
		enabled: !!leaseId && !!propertyId && !!clientId,
	})

const getLeaseTermination = async (
	clientId: string,
	propertyId: string,
	leaseId: string,
	terminationId: string,
) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseTermination>>(
			`${BASE(clientId, propertyId, leaseId)}/${terminationId}?populate=Lease&populate=LeaseChecklist&populate=Document&populate=InitiatedBy&populate=CompletedBy&populate=CancelledBy`,
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useGetLeaseTermination = (
	clientId: string,
	propertyId: string,
	leaseId: string,
	terminationId: string | null,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.LEASE_TERMINATIONS,
			clientId,
			propertyId,
			leaseId,
			terminationId,
		],
		queryFn: () =>
			getLeaseTermination(
				clientId,
				propertyId,
				leaseId,
				terminationId as string,
			),
		enabled: !!terminationId && !!leaseId && !!propertyId && !!clientId,
	})

export interface CreateLeaseTerminationInput {
	client_id: string
	property_id: string
	lease_id: string
	type?: LeaseTerminationType
	reason?: string
}

const createLeaseTermination = async ({
	client_id,
	property_id,
	lease_id,
	...body
}: CreateLeaseTerminationInput) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseTermination>>(
			BASE(client_id, property_id, lease_id),
			{ method: 'POST', body: JSON.stringify(body) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useCreateLeaseTermination = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: createLeaseTermination,
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({
				queryKey: [
					QUERY_KEYS.LEASE_TERMINATIONS,
					variables.client_id,
					variables.property_id,
					variables.lease_id,
				],
			})
		},
	})
}

export interface UpdateLeaseTerminationInput {
	client_id: string
	property_id: string
	lease_id: string
	termination_id: string
	type?: LeaseTerminationType
	reason?: string
	document_mode?: LeaseTerminationDocumentMode | null
	document_url?: string | null
	document_id?: string | null
	lease_checklist_id?: string | null
}

const updateLeaseTermination = async ({
	client_id,
	property_id,
	lease_id,
	termination_id,
	...body
}: UpdateLeaseTerminationInput) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseTermination>>(
			`${BASE(client_id, property_id, lease_id)}/${termination_id}`,
			{ method: 'PATCH', body: JSON.stringify(body) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useUpdateLeaseTermination = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: updateLeaseTermination,
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({
				queryKey: [
					QUERY_KEYS.LEASE_TERMINATIONS,
					variables.client_id,
					variables.property_id,
					variables.lease_id,
				],
			})
		},
	})
}

export interface CompleteLeaseTerminationInput {
	client_id: string
	property_id: string
	lease_id: string
	termination_id: string
}

const completeLeaseTermination = async ({
	client_id,
	property_id,
	lease_id,
	termination_id,
}: CompleteLeaseTerminationInput) => {
	try {
		await fetchClient(
			`${BASE(client_id, property_id, lease_id)}/${termination_id}/complete`,
			{ method: 'PATCH' },
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useCompleteLeaseTermination = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: completeLeaseTermination,
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({
				queryKey: [
					QUERY_KEYS.LEASE_TERMINATIONS,
					variables.client_id,
					variables.property_id,
					variables.lease_id,
				],
			})
			void queryClient.invalidateQueries({
				queryKey: [
					QUERY_KEYS.LEASES,
					variables.client_id,
					variables.property_id,
				],
			})
		},
	})
}

export interface CancelLeaseTerminationInput {
	client_id: string
	property_id: string
	lease_id: string
	termination_id: string
}

const cancelLeaseTermination = async ({
	client_id,
	property_id,
	lease_id,
	termination_id,
}: CancelLeaseTerminationInput) => {
	try {
		await fetchClient(
			`${BASE(client_id, property_id, lease_id)}/${termination_id}/cancel`,
			{ method: 'PATCH' },
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useCancelLeaseTermination = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: cancelLeaseTermination,
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({
				queryKey: [
					QUERY_KEYS.LEASE_TERMINATIONS,
					variables.client_id,
					variables.property_id,
					variables.lease_id,
				],
			})
			void queryClient.invalidateQueries({
				queryKey: [
					QUERY_KEYS.LEASES,
					variables.client_id,
					variables.property_id,
				],
			})
		},
	})
}

export interface TerminationInvoiceLineItem {
	label: string
	category: InvoiceLineItemCategory
	quantity: number
	unit_amount: number
	currency: string
}

export interface CreateTerminationInvoiceInput {
	client_id: string
	property_id: string
	lease_id: string
	termination_id: string
	payer_type: 'TENANT' | 'PROPERTY_OWNER'
	payee_type: 'PROPERTY_OWNER' | 'TENANT'
	line_items: TerminationInvoiceLineItem[]
	due_date?: string
}

const createTerminationInvoice = async ({
	client_id,
	property_id,
	lease_id,
	termination_id,
	...body
}: CreateTerminationInvoiceInput) => {
	try {
		const response = await fetchClient<ApiResponse<Invoice>>(
			`${BASE(client_id, property_id, lease_id)}/${termination_id}/invoices`,
			{ method: 'POST', body: JSON.stringify(body) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useCreateTerminationInvoice = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: createTerminationInvoice,
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({
				queryKey: [
					QUERY_KEYS.INVOICES,
					variables.client_id,
					variables.property_id,
				],
			})
		},
	})
}
