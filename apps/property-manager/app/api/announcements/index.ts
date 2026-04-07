import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all announcements (global, cross-property)
 */
const getAnnouncements = async (
	clientId: string,
	props: FetchMultipleDataInputParams<FetchAnnouncementFilter>,
) => {
	try {
		const params = getQueryParams<FetchAnnouncementFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Announcement>>
		>(`/v1/admin/clients/${clientId}/announcements?${params.toString()}`)
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
	clientId: string,
	query: FetchMultipleDataInputParams<FetchAnnouncementFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.ANNOUNCEMENTS, clientId, query],
		queryFn: () => getAnnouncements(clientId, query),
		enabled: !!clientId,
	})

/**
 * GET announcements scoped to a property
 */
const getPropertyAnnouncements = async (
	clientId: string,
	propertyId: string,
	props: FetchMultipleDataInputParams<FetchAnnouncementFilter>,
) => {
	try {
		const params = getQueryParams<FetchAnnouncementFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Announcement>>
		>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/announcements?${params.toString()}`,
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

export const useGetPropertyAnnouncements = (
	clientId: string,
	propertyId: string | undefined,
	query: FetchMultipleDataInputParams<FetchAnnouncementFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.ANNOUNCEMENTS, clientId, propertyId, query],
		queryFn: () => getPropertyAnnouncements(clientId, propertyId!, query),
		enabled: !!propertyId && !!clientId,
	})

/**
 * GET single announcement by ID
 */
const getAnnouncement = async (clientId: string, id: string) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/clients/${clientId}/announcements/${id}`,
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

export const useGetAnnouncement = (
	clientId: string,
	id: string,
	initialData?: Announcement,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.ANNOUNCEMENTS, clientId, id],
		queryFn: () => getAnnouncement(clientId, id),
		enabled: !!id && !!clientId,
		initialData,
	})

/**
 * CREATE announcement (creates as DRAFT)
 */
const createAnnouncement = async ({
	clientId,
	...props
}: CreateAnnouncementInput & { clientId: string }) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/clients/${clientId}/announcements`,
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
	clientId: string
	id: string
	data: Partial<CreateAnnouncementInput>
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/clients/${props.clientId}/announcements/${props.id}`,
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
const deleteAnnouncement = async ({
	clientId,
	id,
}: {
	clientId: string
	id: string
}) => {
	try {
		await fetchClient(`/v1/admin/clients/${clientId}/announcements/${id}`, {
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
const publishAnnouncement = async ({
	clientId,
	id,
}: {
	clientId: string
	id: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/clients/${clientId}/announcements/${id}/publish`,
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
	clientId: string
	id: string
	scheduled_at: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/clients/${props.clientId}/announcements/${props.id}/schedule`,
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
const cancelScheduledAnnouncement = async ({
	clientId,
	id,
}: {
	clientId: string
	id: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${clientId}/announcements/${id}/schedule`,
			{
				method: 'DELETE',
				body: JSON.stringify({}),
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

export const useCancelScheduledAnnouncement = () =>
	useMutation({ mutationFn: cancelScheduledAnnouncement })

/**
 * EXTEND EXPIRY of a published announcement
 */
const extendAnnouncementExpiry = async (props: {
	clientId: string
	id: string
	expires_at: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/clients/${props.clientId}/announcements/${props.id}/expiry`,
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
const getPropertyAnnouncement = async (
	clientId: string,
	propertyId: string,
	id: string,
) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/announcements/${id}?populate=PropertyBlock`,
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
	clientId: string,
	propertyId: string | undefined,
	id: string | undefined,
	initialData?: Announcement,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.ANNOUNCEMENTS, clientId, propertyId, id],
		queryFn: () => getPropertyAnnouncement(clientId, propertyId!, id!),
		enabled: !!propertyId && !!id && !!clientId,
		initialData,
	})

/**
 * CREATE announcement under a specific property
 */
const createPropertyAnnouncement = async (
	props: Omit<CreateAnnouncementInput, 'property_id'> & {
		clientId: string
		propertyId: string
	},
) => {
	const { clientId, propertyId, ...body } = props
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/announcements`,
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
	clientId: string
	propertyId: string
	id: string
	data: Partial<Omit<CreateAnnouncementInput, 'property_id'>>
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/announcements/${props.id}`,
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
	clientId: string
	propertyId: string
	id: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/announcements/${props.id}`,
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
	clientId: string
	propertyId: string
	id: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/announcements/${props.id}/publish`,
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
	clientId: string
	propertyId: string
	id: string
	scheduled_at: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/announcements/${props.id}/schedule`,
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
	clientId: string
	propertyId: string
	id: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/announcements/${props.id}/schedule`,
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
	clientId: string
	propertyId: string
	id: string
	expires_at: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Announcement>>(
			`/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/announcements/${props.id}/expiry`,
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
