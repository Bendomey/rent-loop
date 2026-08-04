import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient } from '~/lib/transport'

const getNotifications = async (page: number, pageSize: number) => {
	try {
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Notification>>
		>(`/v1/notifications?page=${page}&page_size=${pageSize}`)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useGetNotifications = (page = 1, pageSize = 20) =>
	useQuery({
		queryKey: [QUERY_KEYS.NOTIFICATIONS, page, pageSize],
		queryFn: () => getNotifications(page, pageSize),
		// TODO: fix notifications after working integrating the new notification backend
		enabled: false,
	})

const getNotificationUnreadCount = async () => {
	try {
		const response = await fetchClient<{ data: { count: number } }>(
			'/v1/notifications/unread-count',
		)
		return response.parsedBody.data.count
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
		return 0
	}
}

export const useGetNotificationUnreadCount = () =>
	useQuery({
		queryKey: [QUERY_KEYS.NOTIFICATION_UNREAD_COUNT],
		queryFn: getNotificationUnreadCount,
		enabled: false,
		// refetchInterval: 60_000,
	})

const markNotificationRead = async (notificationId: string) => {
	try {
		await fetchClient(`/v1/notifications/${notificationId}/read`, {
			method: 'POST',
		})
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useMarkNotificationRead = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: markNotificationRead,
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.NOTIFICATIONS],
			})
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.NOTIFICATION_UNREAD_COUNT],
			})
		},
	})
}

const markAllNotificationsRead = async () => {
	try {
		await fetchClient('/v1/notifications/read-all', { method: 'POST' })
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useMarkAllNotificationsRead = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: markAllNotificationsRead,
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.NOTIFICATIONS],
			})
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.NOTIFICATION_UNREAD_COUNT],
			})
		},
	})
}
