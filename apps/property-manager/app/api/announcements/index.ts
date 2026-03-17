import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all announcements (global, cross-property)
 */
const getAnnouncements = async (
	props: FetchMultipleDataInputParams<FetchAnnouncementFilter>,
) => {
	try {
		const params = getQueryParams<FetchAnnouncementFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Announcement>>
		>(`/v1/admin/announcements?${params.toString()}`)
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

export const useGetAnnouncements = (
	query: FetchMultipleDataInputParams<FetchAnnouncementFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.ANNOUNCEMENTS, query],
		queryFn: () => getAnnouncements(query),
	})

/**
 * GET announcements scoped to a property
 */
const getPropertyAnnouncements = async (
	propertyId: string,
	props: FetchMultipleDataInputParams<FetchAnnouncementFilter>,
) => {
	try {
		const params = getQueryParams<FetchAnnouncementFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Announcement>>
		>(`/v1/properties/${propertyId}/announcements?${params.toString()}`)
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

export const useGetPropertyAnnouncements = (
	propertyId: string | undefined,
	query: FetchMultipleDataInputParams<FetchAnnouncementFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.ANNOUNCEMENTS, propertyId, query],
		queryFn: () => getPropertyAnnouncements(propertyId!, query),
		enabled: !!propertyId,
	})

/**
 * GET single announcement by ID
 */
const getAnnouncement = async (id: string) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/announcements/${id}`,
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

export const useGetAnnouncement = (id: string, initialData?: Announcement) =>
	useQuery({
		queryKey: [QUERY_KEYS.ANNOUNCEMENTS, id],
		queryFn: () => getAnnouncement(id),
		enabled: !!id,
		initialData,
	})

/**
 * CREATE announcement (creates as DRAFT)
 */
const createAnnouncement = async (props: CreateAnnouncementInput) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/announcements`,
			{
				method: 'POST',
				body: JSON.stringify(props),
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

export const useCreateAnnouncement = () =>
	useMutation({ mutationFn: createAnnouncement })

/**
 * UPDATE announcement (DRAFT only)
 */
const updateAnnouncement = async (props: {
	id: string
	data: Partial<CreateAnnouncementInput>
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/announcements/${props.id}`,
			{
				method: 'PATCH',
				body: JSON.stringify(props.data),
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

export const useUpdateAnnouncement = () =>
	useMutation({ mutationFn: updateAnnouncement })

/**
 * DELETE announcement (DRAFT only)
 */
const deleteAnnouncement = async (id: string) => {
	try {
		await fetchClient(`/v1/admin/announcements/${id}`, {
			method: 'DELETE',
			body: JSON.stringify({}),
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

export const useDeleteAnnouncement = () =>
	useMutation({ mutationFn: deleteAnnouncement })

/**
 * PUBLISH announcement (DRAFT or SCHEDULED → PUBLISHED immediately)
 */
const publishAnnouncement = async (id: string) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/announcements/${id}/publish`,
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

export const usePublishAnnouncement = () =>
	useMutation({ mutationFn: publishAnnouncement })

/**
 * SCHEDULE announcement (DRAFT → SCHEDULED)
 */
const scheduleAnnouncement = async (props: {
	id: string
	scheduled_at: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/announcements/${props.id}/schedule`,
			{
				method: 'POST',
				body: JSON.stringify({ scheduled_at: props.scheduled_at }),
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

export const useScheduleAnnouncement = () =>
	useMutation({ mutationFn: scheduleAnnouncement })

/**
 * CANCEL SCHEDULED announcement (SCHEDULED → DRAFT)
 */
const cancelScheduledAnnouncement = async (id: string) => {
	try {
		await fetchClient(`/v1/admin/announcements/${id}/schedule`, {
			method: 'DELETE',
			body: JSON.stringify({}),
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

export const useCancelScheduledAnnouncement = () =>
	useMutation({ mutationFn: cancelScheduledAnnouncement })

/**
 * EXTEND EXPIRY of a published announcement
 */
const extendAnnouncementExpiry = async (props: {
	id: string
	expires_at: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/announcements/${props.id}/expiry`,
			{
				method: 'PATCH',
				body: JSON.stringify({ expires_at: props.expires_at }),
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

export const useExtendAnnouncementExpiry = () =>
	useMutation({ mutationFn: extendAnnouncementExpiry })

// ─── Property-scoped mutations ───────────────────────────────────────────────

/**
 * GET single announcement by ID (property-scoped)
 */
const getPropertyAnnouncement = async (propertyId: string, id: string) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/properties/${propertyId}/announcements/${id}`,
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

export const useGetPropertyAnnouncement = (
	propertyId: string | undefined,
	id: string | undefined,
	initialData?: Announcement,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.ANNOUNCEMENTS, propertyId, id],
		queryFn: () => getPropertyAnnouncement(propertyId!, id!),
		enabled: !!propertyId && !!id,
		initialData,
	})

/**
 * CREATE announcement under a specific property
 */
const createPropertyAnnouncement = async (
	props: Omit<CreateAnnouncementInput, 'property_id'> & { propertyId: string },
) => {
	const { propertyId, ...body } = props
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/properties/${propertyId}/announcements`,
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

export const useCreatePropertyAnnouncement = () =>
	useMutation({ mutationFn: createPropertyAnnouncement })

/**
 * UPDATE announcement (DRAFT only, property-scoped)
 */
const updatePropertyAnnouncement = async (props: {
	propertyId: string
	id: string
	data: Partial<Omit<CreateAnnouncementInput, 'property_id'>>
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/properties/${props.propertyId}/announcements/${props.id}`,
			{ method: 'PATCH', body: JSON.stringify(props.data) },
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

export const useUpdatePropertyAnnouncement = () =>
	useMutation({ mutationFn: updatePropertyAnnouncement })

/**
 * DELETE announcement (DRAFT only, property-scoped)
 */
const deletePropertyAnnouncement = async (props: {
	propertyId: string
	id: string
}) => {
	try {
		await fetchClient(
			`/v1/properties/${props.propertyId}/announcements/${props.id}`,
			{ method: 'DELETE', body: JSON.stringify({}) },
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useDeletePropertyAnnouncement = () =>
	useMutation({ mutationFn: deletePropertyAnnouncement })

/**
 * PUBLISH announcement (property-scoped)
 */
const publishPropertyAnnouncement = async (props: {
	propertyId: string
	id: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/properties/${props.propertyId}/announcements/${props.id}/publish`,
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

export const usePublishPropertyAnnouncement = () =>
	useMutation({ mutationFn: publishPropertyAnnouncement })

/**
 * SCHEDULE announcement (property-scoped)
 */
const schedulePropertyAnnouncement = async (props: {
	propertyId: string
	id: string
	scheduled_at: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/properties/${props.propertyId}/announcements/${props.id}/schedule`,
			{
				method: 'POST',
				body: JSON.stringify({ scheduled_at: props.scheduled_at }),
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

export const useSchedulePropertyAnnouncement = () =>
	useMutation({ mutationFn: schedulePropertyAnnouncement })

/**
 * CANCEL SCHEDULED announcement (property-scoped)
 */
const cancelScheduledPropertyAnnouncement = async (props: {
	propertyId: string
	id: string
}) => {
	try {
		await fetchClient(
			`/v1/properties/${props.propertyId}/announcements/${props.id}/schedule`,
			{ method: 'DELETE', body: JSON.stringify({}) },
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useCancelScheduledPropertyAnnouncement = () =>
	useMutation({ mutationFn: cancelScheduledPropertyAnnouncement })

/**
 * EXTEND EXPIRY of a published announcement (property-scoped)
 */
const extendPropertyAnnouncementExpiry = async (props: {
	propertyId: string
	id: string
	expires_at: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/properties/${props.propertyId}/announcements/${props.id}/expiry`,
			{
				method: 'PATCH',
				body: JSON.stringify({ expires_at: props.expires_at }),
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

export const useExtendPropertyAnnouncementExpiry = () =>
	useMutation({ mutationFn: extendPropertyAnnouncementExpiry })
