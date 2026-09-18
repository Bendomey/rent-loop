import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

const financialsPath = (
	clientId: string,
	propertyId: string,
	requestId: string,
) =>
	`/v1/admin/clients/${clientId}/properties/${propertyId}/maintenance-requests/${requestId}/financials`

/**
 * GET every costed line on a maintenance request (paginated)
 */
const getMRFinancials = async (
	clientId: string,
	propertyId: string,
	requestId: string,
	query: FetchMultipleDataInputParams<FetchMRFinancialFilter>,
) => {
	try {
		const params = getQueryParams<FetchMRFinancialFilter>(query)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<MaintenanceRequestFinancial>>
		>(`${financialsPath(clientId, propertyId, requestId)}?${params.toString()}`)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useGetMRFinancials = (
	clientId: string,
	propertyId: string,
	requestId: string,
	query: FetchMultipleDataInputParams<FetchMRFinancialFilter>,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.MR_FINANCIALS,
			clientId,
			propertyId,
			requestId,
			query,
		],
		queryFn: () => getMRFinancials(clientId, propertyId, requestId, query),
		enabled: !!clientId && !!propertyId && !!requestId,
	})

/**
 * POST a costed line.
 *
 * The charge fields apply to TENANT_CHARGE, the expense and vendor fields to
 * VENDOR_EXPENSE. Neither set is required by the schema because which one
 * matters depends on settlement_type; the API enforces that.
 */
export interface CreateMRFinancialInput {
	client_id: string
	property_id: string
	request_id: string
	description: string
	amount: number
	currency?: string
	settlement_type: SettlementType

	charge_category?: TenantChargeCategory
	charge_due_date?: string

	expense_category?: ExpenseCategory
	vendor_name?: string
	vendor_contact?: string
	due_date?: string
	already_paid?: boolean
	payment_provider?: string
	payment_reference?: string
}

const createMRFinancial = async ({
	client_id,
	property_id,
	request_id,
	...data
}: CreateMRFinancialInput) => {
	try {
		const response = await fetchClient<
			ApiResponse<MaintenanceRequestFinancial>
		>(financialsPath(client_id, property_id, request_id), {
			method: 'POST',
			body: JSON.stringify(data),
		})
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useCreateMRFinancial = () =>
	useMutation({ mutationFn: createMRFinancial })

/**
 * PATCH a line's description, or convert who settles it.
 *
 * A conversion voids the old charge or expense and creates the new one, so it
 * is refused once the line has been billed or paid.
 */
export interface UpdateMRFinancialInput {
	client_id: string
	property_id: string
	request_id: string
	financial_id: string
	description?: string
	settlement_type?: SettlementType
	charge_category?: TenantChargeCategory
	charge_due_date?: string
	expense_category?: ExpenseCategory
	vendor_name?: string
	vendor_contact?: string
}

const updateMRFinancial = async ({
	client_id,
	property_id,
	request_id,
	financial_id,
	...data
}: UpdateMRFinancialInput) => {
	try {
		const response = await fetchClient<
			ApiResponse<MaintenanceRequestFinancial>
		>(`${financialsPath(client_id, property_id, request_id)}/${financial_id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		})
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useUpdateMRFinancial = () =>
	useMutation({ mutationFn: updateMRFinancial })

/**
 * PATCH a line to voided, withdrawing whatever obligation it created.
 */
export interface VoidMRFinancialInput {
	client_id: string
	property_id: string
	request_id: string
	financial_id: string
	reason: string
}

const voidMRFinancial = async ({
	client_id,
	property_id,
	request_id,
	financial_id,
	reason,
}: VoidMRFinancialInput) => {
	try {
		await fetchClient(
			`${financialsPath(client_id, property_id, request_id)}/${financial_id}/void`,
			{ method: 'PATCH', body: JSON.stringify({ reason }) },
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useVoidMRFinancial = () =>
	useMutation({ mutationFn: voidMRFinancial })
