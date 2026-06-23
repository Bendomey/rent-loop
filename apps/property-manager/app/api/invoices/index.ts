import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all invoices based on a query.
 */

const getInvoices = async (
	clientId: string,
	propertyId: string,
	props: FetchMultipleDataInputParams<FetchInvoiceFilter>,
) => {
	try {
		const params = getQueryParams<FetchInvoiceFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Invoice>>
		>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/invoices?${params.toString()}`,
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

export const useGetInvoices = (
	clientId: string,
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchInvoiceFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.INVOICES, clientId, propertyId, query],
		queryFn: () => getInvoices(clientId, propertyId, query),
		enabled: !!propertyId && !!clientId,
	})

/**
 * Void an invoice
 */
const voidInvoice = async ({
	client_id,
	property_id,
	id,
	voided_reason,
}: {
	client_id: string
	property_id: string
	id: string
	voided_reason?: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Invoice>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/invoices/${id}/void`,
			{ method: 'PATCH', body: JSON.stringify({ voided_reason }) },
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

export const useVoidInvoice = () => useMutation({ mutationFn: voidInvoice })

/**
 * Delete an invoice (must be DRAFT or VOID status)
 */
const deleteInvoice = async ({
	client_id,
	property_id,
	id,
}: {
	client_id: string
	property_id: string
	id: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${client_id}/properties/${property_id}/invoices/${id}`,
			{
				method: 'DELETE',
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

export const useDeleteInvoice = () => useMutation({ mutationFn: deleteInvoice })

/**
 * Issue a draft invoice (change status to ISSUED)
 */
const issueInvoice = async ({
	client_id,
	property_id,
	id,
}: {
	client_id: string
	property_id: string
	id: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Invoice>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/invoices/${id}/issue`,
			{ method: 'PATCH' },
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

export const useIssueInvoice = () => useMutation({ mutationFn: issueInvoice })

/**
 * Update an invoice
 */
interface UpdateInvoiceInput {
	client_id: string
	property_id: string
	id: string
	allowed_payment_rails?: string[]
	due_date?: string
}

const updateInvoice = async (input: UpdateInvoiceInput) => {
	try {
		const { client_id, property_id, id, ...body } = input
		const response = await fetchClient<ApiResponse<Invoice>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/invoices/${id}`,
			{ method: 'PATCH', body: JSON.stringify(body) },
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

export const useUpdateInvoice = () => useMutation({ mutationFn: updateInvoice })

/**
 * Add a line item to an invoice
 */
interface AddLineItemInput {
	client_id: string
	property_id: string
	invoice_id: string
	label: string
	category: string
	quantity: number
	unit_amount: number
	total_amount: number
	currency: string
	metadata?: Record<string, any>
}

const addLineItem = async (input: AddLineItemInput) => {
	try {
		const { client_id, property_id, invoice_id, ...body } = input
		const response = await fetchClient<ApiResponse<InvoiceLineItem>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/invoices/${invoice_id}/line-items`,
			{ method: 'POST', body: JSON.stringify(body) },
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

export const useAddLineItem = () => useMutation({ mutationFn: addLineItem })

/**
 * Update a line item on an invoice
 */
interface UpdateLineItemInput {
	client_id: string
	property_id: string
	invoice_id: string
	line_item_id: string
	label?: string
	category?: string
	quantity?: number
	unit_amount?: number
	total_amount?: number
	currency?: string
	metadata?: Record<string, any>
}

const updateLineItem = async (input: UpdateLineItemInput) => {
	try {
		const { client_id, property_id, invoice_id, line_item_id, ...body } = input
		const response = await fetchClient<ApiResponse<InvoiceLineItem>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/invoices/${invoice_id}/line-items/${line_item_id}`,
			{ method: 'PATCH', body: JSON.stringify(body) },
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

export const useUpdateLineItem = () => useMutation({ mutationFn: updateLineItem })

/**
 * Remove a line item from an invoice
 */
const removeLineItem = async ({
	client_id,
	property_id,
	invoice_id,
	line_item_id,
}: {
	client_id: string
	property_id: string
	invoice_id: string
	line_item_id: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${client_id}/properties/${property_id}/invoices/${invoice_id}/line-items/${line_item_id}`,
			{
				method: 'DELETE',
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

export const useRemoveLineItem = () => useMutation({ mutationFn: removeLineItem })

