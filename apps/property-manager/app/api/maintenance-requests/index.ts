import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient } from '~/lib/transport'

const LIMIT = 50

const getMaintenanceRequestsByStatus = async ({
	property_id,
	status,
	skip,
}: {
	property_id: string
	status: MaintenanceRequestStatus
	skip: number
}) => {
	try {
		const params = new URLSearchParams({
			property_id,
			status,
			limit: String(LIMIT),
			skip: String(skip),
		})
		const response = await fetchClient<
			ApiResponse<{ rows: MaintenanceRequest[]; meta: { total: number } }>
		>(`/v1/admin/maintenance-requests?${params.toString()}`)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useGetMaintenanceRequestsByStatus = (params: {
	property_id: string
	status: MaintenanceRequestStatus
}) =>
	useInfiniteQuery({
		queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, params],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			getMaintenanceRequestsByStatus({ ...params, skip: pageParam }),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) => {
			const fetched = allPages.flatMap((p) => p?.rows ?? []).length
			const total = lastPage?.meta?.total ?? 0
			return fetched < total ? fetched : undefined
		},
	})

/**
 * Create a maintenance request
 */
export interface CreateMaintenanceRequestInput {
	title: string
	description: string
	priority: MaintenanceRequestPriority
	category: MaintenanceRequestCategory
	unit_id?: string
	lease_id?: string
	visibility?: MaintenanceRequest['visibility']
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
		if (error instanceof Error) throw error
	}
}

export const useCreateMaintenanceRequest = () =>
	useMutation({ mutationFn: createMaintenanceRequest })

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
		if (error instanceof Error) throw error
	}
}

export const useUpdateMaintenanceRequestStatus = () =>
	useMutation({ mutationFn: updateMaintenanceRequestStatus })

/**
 * Assign a worker to a maintenance request
 */
const assignWorker = async ({
	id,
	worker_id,
}: {
	id: string
	worker_id: string
}) => {
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
		if (error instanceof Error) throw error
	}
}

export const useAssignWorker = () => useMutation({ mutationFn: assignWorker })

/**
 * Assign a manager to a maintenance request
 */
const assignManager = async ({
	id,
	manager_id,
}: {
	id: string
	manager_id: string
}) => {
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
		if (error instanceof Error) throw error
	}
}

export const useAssignManager = () => useMutation({ mutationFn: assignManager })
