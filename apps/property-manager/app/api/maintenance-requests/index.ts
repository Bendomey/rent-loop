import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET maintenance requests (paginated)
 */
const getMaintenanceRequests = async (
	props: FetchMultipleDataInputParams<FetchMaintenanceRequestFilter>,
) => {
	try {
		const params = getQueryParams<FetchMaintenanceRequestFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<MaintenanceRequest>>
		>(`/v1/admin/maintenance-requests?${params.toString()}`)
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
	query: FetchMultipleDataInputParams<FetchMaintenanceRequestFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, query],
		queryFn: () => getMaintenanceRequests(query),
	})

export const useGetMaintenanceRequestsInfinite = (
	query: FetchMultipleDataInputParams<FetchMaintenanceRequestFilter>,
) =>
	useInfiniteQuery({
		queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, query],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			getMaintenanceRequests({
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
	title: string
	description: string
	priority: MaintenanceRequestPriority
	category: MaintenanceRequestCategory
	unit_id: string
	visibility: MaintenanceRequest['visibility']
	attachments: Array<string>
}

const createMaintenanceRequest = async (
	input: CreateMaintenanceRequestInput,
) => {
	try {
		const response = await fetchClient<ApiResponse<MaintenanceRequest>>(
			`/v1/admin/maintenance-requests`,
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
	id: string
	title?: string
	description?: string
	priority?: MaintenanceRequestPriority
	category?: MaintenanceRequestCategory
	visibility?: MaintenanceRequest['visibility']
}

const updateMaintenanceRequest = async ({
	id,
	...data
}: UpdateMaintenanceRequestInput) => {
	try {
		const response = await fetchClient<ApiResponse<MaintenanceRequest>>(
			`/v1/admin/maintenance-requests/${id}`,
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
	id: string
	status: MaintenanceRequestStatus
	cancellation_reason?: string
}

const updateMaintenanceRequestStatus = async ({
	id,
	status,
	cancellation_reason,
}: UpdateMaintenanceRequestStatusInput) => {
	try {
		await fetchClient(`/v1/admin/maintenance-requests/${id}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ status, cancellation_reason }),
		})
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
	id: string
	worker_id: string
}

const assignWorker = async ({
	id,
	worker_id,
}: AssignMaintenanceWorkerInput) => {
	try {
		await fetchClient(`/v1/admin/maintenance-requests/${id}/assign-worker`, {
			method: 'POST',
			body: JSON.stringify({ worker_id }),
		})
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
	id: string
	manager_id: string
}

const assignManager = async ({
	id,
	manager_id,
}: AssignMaintenanceManagerInput) => {
	try {
		await fetchClient(`/v1/admin/maintenance-requests/${id}/assign-manager`, {
			method: 'POST',
			body: JSON.stringify({ manager_id }),
		})
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
	id: string,
	query: FetchMultipleDataInputParams<FetchMaintenanceRequestActivityLogFilter>,
) => {
	try {
		const params =
			getQueryParams<FetchMaintenanceRequestActivityLogFilter>(query)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<MaintenanceRequestActivityLog>>
		>(`/v1/admin/maintenance-requests/${id}/activity_logs?${params.toString()}`)
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
	id: string,
	query: FetchMultipleDataInputParams<FetchMaintenanceRequestActivityLogFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, id, 'activity_logs', query],
		queryFn: () => getMaintenanceRequestActivityLogs(id, query),
		enabled: !!id,
	})

/**
 * GET expenses for a maintenance request (paginated)
 */
const getMaintenanceRequestExpenses = async (
	id: string,
	query: FetchMultipleDataInputParams<FetchMaintenanceExpenseFilter>,
) => {
	try {
		const params = getQueryParams<FetchMaintenanceExpenseFilter>(query)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<MaintenanceExpense>>
		>(`/v1/admin/maintenance-requests/${id}/expenses?${params.toString()}`)
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

export const useGetMaintenanceRequestExpenses = (
	id: string,
	query: FetchMultipleDataInputParams<FetchMaintenanceExpenseFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, id, 'expenses', query],
		queryFn: () => getMaintenanceRequestExpenses(id, query),
		enabled: !!id,
	})

/**
 * POST an expense to a maintenance request
 */
export interface CreateMaintenanceExpenseInput {
	id: string
	description: string
	amount: number
	currency?: string
	paid_by: MaintenanceExpense['paid_by']
	billable_to_tenant: boolean
}

const createMaintenanceExpense = async ({
	id,
	...data
}: CreateMaintenanceExpenseInput) => {
	try {
		const response = await fetchClient<ApiResponse<MaintenanceExpense>>(
			`/v1/admin/maintenance-requests/${id}/expenses`,
			{ method: 'POST', body: JSON.stringify(data) },
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

export const useCreateMaintenanceExpense = () =>
	useMutation({ mutationFn: createMaintenanceExpense })

/**
 * DELETE an expense from a maintenance request
 */
export interface DeleteMaintenanceExpenseInput {
	id: string
	expense_id: string
}

const deleteMaintenanceExpense = async ({
	id,
	expense_id,
}: DeleteMaintenanceExpenseInput) => {
	try {
		await fetchClient(
			`/v1/admin/maintenance-requests/${id}/expenses/${expense_id}`,
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

export const useDeleteMaintenanceExpense = () =>
	useMutation({ mutationFn: deleteMaintenanceExpense })

/**
 * Generate a draft invoice from billable expenses
 */
const generateMaintenanceInvoice = async (id: string) => {
	try {
		const response = await fetchClient<ApiResponse<string>>(
			`/v1/admin/maintenance-requests/${id}/expenses:invoice`,
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

export const useGenerateMaintenanceInvoice = () =>
	useMutation({ mutationFn: generateMaintenanceInvoice })

/**
 * GET comments for a maintenance request (paginated)
 */
const getMaintenanceRequestComments = async (
	id: string,
	query: FetchMultipleDataInputParams<FetchMaintenanceRequestCommentFilter>,
) => {
	try {
		const params = getQueryParams<FetchMaintenanceRequestCommentFilter>(query)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<MaintenanceRequestComment>>
		>(`/v1/admin/maintenance-requests/${id}/comments?${params.toString()}`)
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
	id: string,
	query: FetchMultipleDataInputParams<FetchMaintenanceRequestCommentFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, id, 'comments', query],
		queryFn: () => getMaintenanceRequestComments(id, query),
		enabled: !!id,
	})

/**
 * CREATE a comment on a maintenance request
 */
export interface CreateMaintenanceRequestCommentInput {
	id: string
	content: string
}

const createMaintenanceRequestComment = async ({
	id,
	content,
}: CreateMaintenanceRequestCommentInput) => {
	try {
		const response = await fetchClient<ApiResponse<MaintenanceRequestComment>>(
			`/v1/admin/maintenance-requests/${id}/comments`,
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
	id: string
	comment_id: string
	content: string
}

const updateMaintenanceRequestComment = async ({
	id,
	comment_id,
	content,
}: UpdateMaintenanceRequestCommentInput) => {
	try {
		const response = await fetchClient<ApiResponse<MaintenanceRequestComment>>(
			`/v1/admin/maintenance-requests/${id}/comments/${comment_id}`,
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
	id: string
	comment_id: string
}

const deleteMaintenanceRequestComment = async ({
	id,
	comment_id,
}: DeleteMaintenanceRequestCommentInput) => {
	try {
		await fetchClient(
			`/v1/admin/maintenance-requests/${id}/comments/${comment_id}`,
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
