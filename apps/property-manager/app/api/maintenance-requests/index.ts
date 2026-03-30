import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET maintenance requests (paginated)
 */
const getMaintenanceRequests = async (
	propertyId: string,
	props: FetchMultipleDataInputParams<FetchMaintenanceRequestFilter>,
) => {
	try {
		const params = getQueryParams<FetchMaintenanceRequestFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<MaintenanceRequest>>
		>(
			`/v1/admin/properties/${propertyId}/maintenance-requests?${params.toString()}`,
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

export const useGetMaintenanceRequests = (
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchMaintenanceRequestFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, propertyId, query],
		queryFn: () => getMaintenanceRequests(propertyId, query),
		enabled: !!propertyId,
	})

export const useGetMaintenanceRequestsInfinite = (
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchMaintenanceRequestFilter>,
) =>
	useInfiniteQuery({
		queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, propertyId, query],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			getMaintenanceRequests(propertyId, {
				...query,
				pagination: {
					...query.pagination,
					page: pageParam,
					per: query.pagination?.per ?? 50,
				},
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage) =>
			lastPage?.meta?.has_next_page ? lastPage.meta.page + 1 : undefined,
	})

/**
 * Create a maintenance request
 */
export interface CreateMaintenanceRequestInput {
	property_id: string
	title: string
	description: string
	priority: MaintenanceRequestPriority
	category: MaintenanceRequestCategory
	unit_id: string
	visibility: MaintenanceRequest['visibility']
	attachments: Array<string>
}

const createMaintenanceRequest = async ({
	property_id,
	...input
}: CreateMaintenanceRequestInput) => {
	try {
		const response = await fetchClient<ApiResponse<MaintenanceRequest>>(
			`/v1/admin/properties/${property_id}/maintenance-requests`,
			{
				method: 'POST',
				body: JSON.stringify(input),
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

export const useCreateMaintenanceRequest = () =>
	useMutation({ mutationFn: createMaintenanceRequest })

/**
 * Update a maintenance request's fields
 */
export interface UpdateMaintenanceRequestInput {
	property_id: string
	id: string
	title?: string
	description?: string
	priority?: MaintenanceRequestPriority
	category?: MaintenanceRequestCategory
	visibility?: MaintenanceRequest['visibility']
}

const updateMaintenanceRequest = async ({
	property_id,
	id,
	...data
}: UpdateMaintenanceRequestInput) => {
	try {
		const response = await fetchClient<ApiResponse<MaintenanceRequest>>(
			`/v1/admin/properties/${property_id}/maintenance-requests/${id}`,
			{ method: 'PATCH', body: JSON.stringify(data) },
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

export const useUpdateMaintenanceRequest = () =>
	useMutation({ mutationFn: updateMaintenanceRequest })

/**
 * Update a maintenance request's status
 */
export interface UpdateMaintenanceRequestStatusInput {
	property_id: string
	id: string
	status: MaintenanceRequestStatus
	cancellation_reason?: string
}

const updateMaintenanceRequestStatus = async ({
	property_id,
	id,
	status,
	cancellation_reason,
}: UpdateMaintenanceRequestStatusInput) => {
	try {
		await fetchClient(
			`/v1/admin/properties/${property_id}/maintenance-requests/${id}/status`,
			{
				method: 'PATCH',
				body: JSON.stringify({ status, cancellation_reason }),
			},
		)
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

export const useUpdateMaintenanceRequestStatus = () =>
	useMutation({ mutationFn: updateMaintenanceRequestStatus })

/**
 * Assign a worker to a maintenance request
 */
export interface AssignMaintenanceWorkerInput {
	property_id: string
	id: string
	worker_id: string
}

const assignWorker = async ({
	property_id,
	id,
	worker_id,
}: AssignMaintenanceWorkerInput) => {
	try {
		await fetchClient(
			`/v1/admin/properties/${property_id}/maintenance-requests/${id}/assign-worker`,
			{
				method: 'POST',
				body: JSON.stringify({ worker_id }),
			},
		)
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

export const useAssignWorker = () => useMutation({ mutationFn: assignWorker })

/**
 * Assign a manager to a maintenance request
 */
export interface AssignMaintenanceManagerInput {
	property_id: string
	id: string
	manager_id: string
}

const assignManager = async ({
	property_id,
	id,
	manager_id,
}: AssignMaintenanceManagerInput) => {
	try {
		await fetchClient(
			`/v1/admin/properties/${property_id}/maintenance-requests/${id}/assign-manager`,
			{
				method: 'POST',
				body: JSON.stringify({ manager_id }),
			},
		)
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

export const useAssignManager = () => useMutation({ mutationFn: assignManager })

/**
 * GET activity logs for a maintenance request (paginated)
 */
const getMaintenanceRequestActivityLogs = async (
	propertyId: string,
	id: string,
	query: FetchMultipleDataInputParams<FetchMaintenanceRequestActivityLogFilter>,
) => {
	try {
		const params =
			getQueryParams<FetchMaintenanceRequestActivityLogFilter>(query)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<MaintenanceRequestActivityLog>>
		>(
			`/v1/admin/properties/${propertyId}/maintenance-requests/${id}/activity_logs?${params.toString()}`,
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

export const useGetMaintenanceRequestActivityLogs = (
	propertyId: string,
	id: string,
	query: FetchMultipleDataInputParams<FetchMaintenanceRequestActivityLogFilter>,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.MAINTENANCE_REQUESTS,
			propertyId,
			id,
			'activity_logs',
			query,
		],
		queryFn: () => getMaintenanceRequestActivityLogs(propertyId, id, query),
		enabled: !!id && !!propertyId,
	})

/**
 * GET comments for a maintenance request (paginated)
 */
const getMaintenanceRequestComments = async (
	propertyId: string,
	id: string,
	query: FetchMultipleDataInputParams<FetchMaintenanceRequestCommentFilter>,
) => {
	try {
		const params = getQueryParams<FetchMaintenanceRequestCommentFilter>(query)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<MaintenanceRequestComment>>
		>(
			`/v1/admin/properties/${propertyId}/maintenance-requests/${id}/comments?${params.toString()}`,
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

export const useGetMaintenanceRequestComments = (
	propertyId: string,
	id: string,
	query: FetchMultipleDataInputParams<FetchMaintenanceRequestCommentFilter>,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.MAINTENANCE_REQUESTS,
			propertyId,
			id,
			'comments',
			query,
		],
		queryFn: () => getMaintenanceRequestComments(propertyId, id, query),
		enabled: !!id && !!propertyId,
	})

/**
 * CREATE a comment on a maintenance request
 */
export interface CreateMaintenanceRequestCommentInput {
	property_id: string
	id: string
	content: string
}

const createMaintenanceRequestComment = async ({
	property_id,
	id,
	content,
}: CreateMaintenanceRequestCommentInput) => {
	try {
		const response = await fetchClient<ApiResponse<MaintenanceRequestComment>>(
			`/v1/admin/properties/${property_id}/maintenance-requests/${id}/comments`,
			{ method: 'POST', body: JSON.stringify({ content }) },
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

export const useCreateMaintenanceRequestComment = () =>
	useMutation({ mutationFn: createMaintenanceRequestComment })

/**
 * UPDATE a comment on a maintenance request
 */
export interface UpdateMaintenanceRequestCommentInput {
	property_id: string
	id: string
	comment_id: string
	content: string
}

const updateMaintenanceRequestComment = async ({
	property_id,
	id,
	comment_id,
	content,
}: UpdateMaintenanceRequestCommentInput) => {
	try {
		const response = await fetchClient<ApiResponse<MaintenanceRequestComment>>(
			`/v1/admin/properties/${property_id}/maintenance-requests/${id}/comments/${comment_id}`,
			{ method: 'PATCH', body: JSON.stringify({ content }) },
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

export const useUpdateMaintenanceRequestComment = () =>
	useMutation({ mutationFn: updateMaintenanceRequestComment })

/**
 * DELETE a comment on a maintenance request
 */
export interface DeleteMaintenanceRequestCommentInput {
	property_id: string
	id: string
	comment_id: string
}

const deleteMaintenanceRequestComment = async ({
	property_id,
	id,
	comment_id,
}: DeleteMaintenanceRequestCommentInput) => {
	try {
		await fetchClient(
			`/v1/admin/properties/${property_id}/maintenance-requests/${id}/comments/${comment_id}`,
			{ method: 'DELETE' },
		)
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

export const useDeleteMaintenanceRequestComment = () =>
	useMutation({ mutationFn: deleteMaintenanceRequestComment })
