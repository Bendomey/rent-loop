import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all invoices based on a query.
 */

const getInvoices = async (
	props: FetchMultipleDataInputParams<FetchInvoiceFilter>,
) => {
	try {
		const params = getQueryParams<FetchInvoiceFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Invoice>>
		>(`/v1/admin/invoices?${params.toString()}`)
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
	query: FetchMultipleDataInputParams<FetchInvoiceFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.INVOICES, query],
		queryFn: () => getInvoices(query),
	})

/**
 * Void an invoice
 */
const voidInvoice = async (id: string) => {
	try {
		const response = await fetchClient<ApiResponse<Invoice>>(
			`/v1/admin/invoices/${id}/void`,
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

export const useVoidInvoice = () => useMutation({ mutationFn: voidInvoice })

/**
 * Delete an invoice (must be DRAFT or VOID status)
 */
const deleteInvoice = async (id: string) => {
	try {
		await fetchClient(`/v1/admin/invoices/${id}`, { method: 'DELETE' })
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
 * Notify tenant to pay invoice
 * TODO: Backend endpoint POST /v1/admin/invoices/{id}/notify not yet implemented.
 */
const notifyTenantForInvoice = async (id: string) => {
	try {
		await fetchClient(`/v1/admin/invoices/${id}/notify`, { method: 'POST' })
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

export const useNotifyTenantForInvoice = () =>
	useMutation({ mutationFn: notifyTenantForInvoice })
