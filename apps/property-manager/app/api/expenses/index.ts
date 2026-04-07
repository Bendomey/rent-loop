import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all expenses for a property (paginated)
 */
const getPropertyExpenses = async (
	clientId: string,
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchExpenseFilter>,
) => {
	try {
		const params = getQueryParams<FetchExpenseFilter>(query)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Expense>>
		>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/expenses?${params.toString()}`,
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

export const useGetPropertyExpenses = (
	clientId: string,
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchExpenseFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.EXPENSES, clientId, propertyId, query],
		queryFn: () => getPropertyExpenses(clientId, propertyId, query),
		enabled: !!propertyId && !!clientId,
	})

/**
 * GET expenses for a lease (paginated)
 */
const getLeaseExpenses = async (
	clientId: string,
	propertyId: string,
	leaseId: string,
	query: FetchMultipleDataInputParams<FetchExpenseFilter>,
) => {
	try {
		const params = getQueryParams<FetchExpenseFilter>(query)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Expense>>
		>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/leases/${leaseId}/expenses?${params.toString()}`,
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

export const useGetLeaseExpenses = (
	clientId: string,
	propertyId: string,
	leaseId: string,
	query: FetchMultipleDataInputParams<FetchExpenseFilter>,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.LEASES,
			clientId,
			propertyId,
			leaseId,
			'expenses',
			query,
		],
		queryFn: () => getLeaseExpenses(clientId, propertyId, leaseId, query),
		enabled: !!propertyId && !!leaseId && !!clientId,
	})

/**
 * GET expenses for a maintenance request (paginated)
 */
const getMRExpenses = async (
	clientId: string,
	propertyId: string,
	maintenanceRequestId: string,
	query: FetchMultipleDataInputParams<FetchExpenseFilter>,
) => {
	try {
		const params = getQueryParams<FetchExpenseFilter>(query)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Expense>>
		>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/maintenance-requests/${maintenanceRequestId}/expenses?${params.toString()}`,
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

export const useGetMRExpenses = (
	clientId: string,
	propertyId: string,
	maintenanceRequestId: string,
	query: FetchMultipleDataInputParams<FetchExpenseFilter>,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.EXPENSES,
			clientId,
			propertyId,
			'maintenance-requests',
			maintenanceRequestId,
			query,
		],
		queryFn: () =>
			getMRExpenses(clientId, propertyId, maintenanceRequestId, query),
		enabled: !!propertyId && !!maintenanceRequestId && !!clientId,
	})

/**
 * POST a new expense (property-scoped, context_type determines LEASE or MAINTENANCE)
 */
export interface CreateExpenseInput {
	client_id: string
	property_id: string
	context_type: 'LEASE' | 'MAINTENANCE'
	context_lease_id?: string
	context_maintenance_request_id?: string
	description: string
	amount: number
	currency?: string
}

const createExpense = async ({
	client_id,
	property_id,
	...data
}: CreateExpenseInput) => {
	try {
		const response = await fetchClient<ApiResponse<Expense>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/expenses`,
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

export const useCreateExpense = () => useMutation({ mutationFn: createExpense })

/**
 * DELETE an expense (property-scoped)
 */
export interface DeleteExpenseInput {
	client_id: string
	property_id: string
	expense_id: string
}

const deleteExpense = async ({
	client_id,
	property_id,
	expense_id,
}: DeleteExpenseInput) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${client_id}/properties/${property_id}/expenses/${expense_id}`,
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

export const useDeleteExpense = () => useMutation({ mutationFn: deleteExpense })

/**
 * Generate invoices from an expense (property-scoped)
 */
export interface GenerateExpenseInvoicePayer {
	payer_type: 'TENANT' | 'PROPERTY_OWNER'
	payee_type: 'TENANT' | 'PROPERTY_OWNER' | 'EXTERNAL'
	amount: number
}

export interface GenerateExpenseInvoiceInput {
	client_id: string
	property_id: string
	expense_id: string
	payers: GenerateExpenseInvoicePayer[]
}

const generateExpenseInvoice = async ({
	client_id,
	property_id,
	expense_id,
	payers,
}: GenerateExpenseInvoiceInput) => {
	try {
		const response = await fetchClient<ApiResponse<Invoice[]>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/expenses/${expense_id}/generate:invoice`,
			{ method: 'POST', body: JSON.stringify({ payers }) },
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

export const useGenerateExpenseInvoice = () =>
	useMutation({ mutationFn: generateExpenseInvoice })
