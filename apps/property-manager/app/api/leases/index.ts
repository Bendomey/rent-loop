import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
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
}

const updateLease = async (props: UpdateLeaseInput) => {
	try {
		const body: Record<string, unknown> = {}
		if (props.utility_transfers_date)
			body.utility_transfers_date = props.utility_transfers_date.toISOString()

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

export interface BulkOnboardLeaseEntryInput {
	unit_id: string
	first_name: string
	other_names?: string
	last_name: string
	email?: string
	phone: string
	gender: 'Male' | 'Female'
	date_of_birth: string // ISO string
	nationality: string
	marital_status: 'Single' | 'Married' | 'Divorced' | 'Widowed'
	current_address: string
	id_type: 'NationalID' | 'Passport' | 'DriverLicense'
	id_number: string
	emergency_contact_name: string
	emergency_contact_phone: string
	relationship_to_emergency_contact: string
	occupation?: string
	employer?: string
	rent_fee: number
	rent_fee_currency: string
	payment_frequency?: string
	move_in_date: string // ISO string
	stay_duration_frequency: 'HOURS' | 'DAYS' | 'MONTHS'
	stay_duration: number
	rent_payment_status: 'NONE' | 'PARTIAL' | 'FULL'
	periods_paid?: number
	billing_cycle_start_date?: string // ISO string
	security_deposit_fee: number
	security_deposit_fee_currency: string
	lease_agreement_document_url: string
}

const bulkOnboardLeases = async (props: {
	clientId: string
	propertyId: string
	entries: BulkOnboardLeaseEntryInput[]
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/leases:bulk-onboard`,
			{
				method: 'POST',
				body: JSON.stringify({ entries: props.entries }),
			},
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
		throw new Error(String(error))
	}
}

export const useBulkOnboardLeases = () =>
	useMutation({ mutationFn: bulkOnboardLeases })
