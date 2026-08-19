import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import type { PaymentFrequency } from '~/lib/schedule'
import { fetchClient } from '~/lib/transport'

const getPropertyLeases = async (
	clientId: string,
	propertyId: string,
	props: FetchMultipleDataInputParams<FetchLeaseFilter>,
) => {
	try {
		const params = getQueryParams<FetchLeaseFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Lease>>
		>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/leases?${params.toString()}`,
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

export const useGetPropertyLeases = (
	clientId: string,
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchLeaseFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.LEASES, clientId, propertyId, query],
		queryFn: () => getPropertyLeases(clientId, propertyId, query),
		enabled: !!propertyId && !!clientId,
	})

const getTenantLeases = async (
	clientId: string,
	propertyId: string,
	tenantId: string,
	props: FetchMultipleDataInputParams<FetchLeaseFilter>,
) => {
	try {
		const params = getQueryParams<FetchLeaseFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Lease>>
		>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/tenants/${tenantId}/leases?${params.toString()}`,
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

export interface UpdateLeaseInput {
	clientId: string
	propertyId: string
	leaseId: string
	utility_transfers_date?: Date
	lease_agreement_document_url?: string | null
}

const updateLease = async (props: UpdateLeaseInput) => {
	try {
		const body: Record<string, unknown> = {}
		if (props.utility_transfers_date)
			body.utility_transfers_date = props.utility_transfers_date.toISOString()
		if (props.lease_agreement_document_url !== undefined)
			body.lease_agreement_document_url = props.lease_agreement_document_url

		const response = await fetchClient<ApiResponse<Lease>>(
			`/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/leases/${props.leaseId}`,
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
		if (error instanceof Error) throw error
	}
}

export const useUpdateLease = () => useMutation({ mutationFn: updateLease })

const activateLease = async (props: {
	clientId: string
	propertyId: string
	leaseId: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/leases/${props.leaseId}/status:active`,
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

export const useActivateLease = () => useMutation({ mutationFn: activateLease })

export const useGetTenantLeases = (
	clientId: string,
	propertyId: string,
	tenantId: string,
	query: FetchMultipleDataInputParams<FetchLeaseFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.LEASES, clientId, propertyId, tenantId, query],
		queryFn: () => getTenantLeases(clientId, propertyId, tenantId, query),
		enabled: !!tenantId && !!propertyId && !!clientId,
	})

/**
 * GET leases across every property the caller can access (paginated).
 * Callers own all params — pagination, filters, ordering, populate.
 */
const getLeasesAcrossProperties = async (
	clientId: string,
	props: FetchMultipleDataInputParams<Record<string, unknown>>,
) => {
	try {
		const params = getQueryParams<Record<string, unknown>>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Lease>>
		>(`/v1/admin/clients/${clientId}/leases?${params.toString()}`)
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

export const useGetLeasesAcrossPropertiesInfinite = (
	clientId: string,
	query: FetchMultipleDataInputParams<Record<string, unknown>>,
	enabled = true,
) =>
	useInfiniteQuery({
		queryKey: [QUERY_KEYS.LEASES, 'across-properties', clientId, query],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			getLeasesAcrossProperties(clientId, {
				...query,
				pagination: { ...query.pagination, page: pageParam },
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage) =>
			lastPage?.meta?.has_next_page ? lastPage.meta.page + 1 : undefined,
		enabled: enabled && !!clientId,
	})

/** One-off amount due at the start of a renewed term. */
export interface RenewLeaseFee {
	category:
		| 'SECURITY_DEPOSIT'
		| 'AGENCY_FEE'
		| 'VAT'
		| 'UTILITY'
		| 'DAMAGE_CHARGE'
		| 'EARLY_TERMINATION_FEE'
		| 'OTHER'
	name: string
	amount: number
}

export interface RenewLeaseBody {
	move_in_date: string
	stay_duration: number
	stay_duration_frequency: PaymentFrequency
	/** Defaults to the parent's rent when omitted. */
	rent_fee?: number
	/** Defaults to the parent's unit when omitted. */
	unit_id?: string
	/**
	 * Only meaningful when unit_id differs from the parent's — the API refuses
	 * it outright on a same-room renewal, so the wizard must not send it there.
	 */
	carry_financial_account?: boolean
	/** Created with the renewal, so a term never exists with half its money. */
	fees?: RenewLeaseFee[]
	lease_agreement_document_url?: string
}

/**
 * Continue a tenancy with a new term.
 *
 * The renewal comes back Pending: the daily lifecycle sweeps activate it and
 * complete the parent on the changeover day, so nothing here has to schedule
 * anything.
 */
const renewLease = async (props: {
	clientId: string
	propertyId: string
	leaseId: string
	body: RenewLeaseBody
}) => {
	try {
		const response = await fetchClient<ApiResponse<Lease>>(
			`/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/leases/${props.leaseId}/renew`,
			{ method: 'POST', body: JSON.stringify(props.body) },
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

export const useRenewLease = () => useMutation({ mutationFn: renewLease })
