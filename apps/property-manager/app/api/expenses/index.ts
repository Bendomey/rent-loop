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
 * GET a single expense with its invoice
 */
const getExpense = async (
	clientId: string,
	propertyId: string,
	expenseId: string,
) => {
	try {
		const response = await fetchClient<ApiResponse<Expense>>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/expenses/${expenseId}`,
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

export const useGetExpense = (
	clientId: string,
	propertyId: string,
	expenseId: string,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.EXPENSES, clientId, propertyId, expenseId],
		queryFn: () => getExpense(clientId, propertyId, expenseId),
		enabled: !!propertyId && !!clientId && !!expenseId,
	})

/**
 * POST a general expense.
 *
 * Maintenance expenses are created through a maintenance request's financial
 * line, never here — the API refuses any other context.
 */
export interface CreateExpenseInput {
	client_id: string
	property_id: string
	category: ExpenseCategory
	vendor_name: string
	vendor_contact?: string
	description: string
	amount: number
	currency?: string
	due_date?: string
	// Records the payment in the same call, so the expense lands settled
	// instead of sitting as a payable.
	already_paid: boolean
	payment_provider?: string
	payment_reference?: string
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
 * PATCH an expense.
 *
 * Amount and category are absent by design: both decide what the already
 * posted journal entry says, so changing either means voiding and recreating.
 */
export interface UpdateExpenseInput {
	client_id: string
	property_id: string
	expense_id: string
	description?: string
	vendor_name?: string
	vendor_contact?: string
}

const updateExpense = async ({
	client_id,
	property_id,
	expense_id,
	...data
}: UpdateExpenseInput) => {
	try {
		const response = await fetchClient<ApiResponse<Expense>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/expenses/${expense_id}`,
			{ method: 'PATCH', body: JSON.stringify(data) },
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

export const useUpdateExpense = () => useMutation({ mutationFn: updateExpense })

/**
 * PATCH an expense to voided, which withdraws its bill too.
 */
export interface VoidExpenseInput {
	client_id: string
	property_id: string
	expense_id: string
	reason: string
}

const voidExpense = async ({
	client_id,
	property_id,
	expense_id,
	reason,
}: VoidExpenseInput) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${client_id}/properties/${property_id}/expenses/${expense_id}/void`,
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

export const useVoidExpense = () => useMutation({ mutationFn: voidExpense })
