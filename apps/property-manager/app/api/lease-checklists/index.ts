import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

const BASE = (propertyId: string, leaseId: string) =>
	`/v1/admin/properties/${propertyId}/leases/${leaseId}/checklists`

/**
 * GET all checklists for a lease
 */
const getLeaseChecklists = async (
	propertyId: string,
	leaseId: string,
	props: FetchMultipleDataInputParams<FetchLeaseChecklistFilter>,
) => {
	try {
		const params = getQueryParams<FetchLeaseChecklistFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<LeaseChecklist>>
		>(`${BASE(propertyId, leaseId)}?${params.toString()}`)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useGetLeaseChecklists = (
	propertyId: string,
	leaseId: string,
	query: FetchMultipleDataInputParams<FetchLeaseChecklistFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.LEASE_CHECKLISTS, propertyId, leaseId, query],
		queryFn: () => getLeaseChecklists(propertyId, leaseId, query),
		enabled: !!leaseId && !!propertyId,
	})

/**
 * CREATE a new checklist for a lease
 */
export interface ChecklistItemDraft {
	description: string
	status: LeaseChecklistItemStatus
	notes?: string
	photos?: string[]
}

export interface CreateLeaseChecklistInput {
	property_id: string
	lease_id: string
	type: LeaseChecklistType
	checklist_items: ChecklistItemDraft[]
	template_id?: string
}

const createLeaseChecklist = async ({
	property_id,
	lease_id,
	...data
}: CreateLeaseChecklistInput) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseChecklist>>(
			BASE(property_id, lease_id),
			{ method: 'POST', body: JSON.stringify(data) },
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

export const useCreateLeaseChecklist = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: createLeaseChecklist,
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.LEASE_CHECKLISTS, variables.lease_id],
			})
		},
	})
}

/**
 * DELETE a checklist
 */
export interface DeleteLeaseChecklistInput {
	property_id: string
	lease_id: string
	checklist_id: string
}

const deleteLeaseChecklist = async ({
	property_id,
	lease_id,
	checklist_id,
}: DeleteLeaseChecklistInput) => {
	try {
		await fetchClient(`${BASE(property_id, lease_id)}/${checklist_id}`, {
			method: 'DELETE',
		})
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useDeleteLeaseChecklist = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: deleteLeaseChecklist,
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.LEASE_CHECKLISTS, variables.lease_id],
			})
		},
	})
}

/**
 * SUBMIT a checklist for tenant review
 */
export interface SubmitLeaseChecklistInput {
	property_id: string
	lease_id: string
	checklist_id: string
}

const submitLeaseChecklist = async ({
	property_id,
	lease_id,
	checklist_id,
}: SubmitLeaseChecklistInput) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseChecklist>>(
			`${BASE(property_id, lease_id)}/${checklist_id}/submit`,
			{ method: 'POST' },
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

export const useSubmitLeaseChecklist = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: submitLeaseChecklist,
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.LEASE_CHECKLISTS, variables.lease_id],
			})
		},
	})
}

/**
 * CREATE a checklist item
 */
export interface CreateLeaseChecklistItemInput {
	property_id: string
	lease_id: string
	checklist_id: string
	description: string
	status: LeaseChecklistItemStatus
	notes?: string
	photos?: string[]
}

const createLeaseChecklistItem = async ({
	property_id,
	lease_id,
	checklist_id,
	...data
}: CreateLeaseChecklistItemInput) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseChecklistItem>>(
			`${BASE(property_id, lease_id)}/${checklist_id}/items`,
			{ method: 'POST', body: JSON.stringify(data) },
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

export const useCreateLeaseChecklistItem = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: createLeaseChecklistItem,
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.LEASE_CHECKLISTS, variables.lease_id],
			})
		},
	})
}

/**
 * UPDATE a checklist item
 */
export interface UpdateLeaseChecklistItemInput {
	property_id: string
	lease_id: string
	checklist_id: string
	item_id: string
	description?: string
	status?: LeaseChecklistItemStatus
	notes?: string | null
	photos?: string[] | null
}

const updateLeaseChecklistItem = async ({
	property_id,
	lease_id,
	checklist_id,
	item_id,
	...data
}: UpdateLeaseChecklistItemInput) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseChecklistItem>>(
			`${BASE(property_id, lease_id)}/${checklist_id}/items/${item_id}`,
			{ method: 'PATCH', body: JSON.stringify(data) },
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

export const useUpdateLeaseChecklistItem = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: updateLeaseChecklistItem,
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.LEASE_CHECKLISTS, variables.lease_id],
			})
		},
	})
}

/**
 * DELETE a checklist item
 */
export interface DeleteLeaseChecklistItemInput {
	property_id: string
	lease_id: string
	checklist_id: string
	item_id: string
}

const deleteLeaseChecklistItem = async ({
	property_id,
	lease_id,
	checklist_id,
	item_id,
}: DeleteLeaseChecklistItemInput) => {
	try {
		await fetchClient(
			`${BASE(property_id, lease_id)}/${checklist_id}/items/${item_id}`,
			{ method: 'DELETE' },
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useDeleteLeaseChecklistItem = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: deleteLeaseChecklistItem,
		onSuccess: (_, variables) => {
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.LEASE_CHECKLISTS, variables.lease_id],
			})
		},
	})
}
