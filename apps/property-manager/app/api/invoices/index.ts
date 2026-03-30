import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all invoices based on a query.
 */

const getInvoices = async (
	propertyId: string,
	props: FetchMultipleDataInputParams<FetchInvoiceFilter>,
) => {
	try {
		const params = getQueryParams<FetchInvoiceFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Invoice>>
		>(`/v1/admin/properties/${propertyId}/invoices?${params.toString()}`)
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
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchInvoiceFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.INVOICES, propertyId, query],
		queryFn: () => getInvoices(propertyId, query),
		enabled: !!propertyId,
	})

/**
 * Void an invoice
 */
const voidInvoice = async ({
	property_id,
	id,
	voided_reason,
}: {
	property_id: string
	id: string
	voided_reason?: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Invoice>>(
			`/v1/admin/properties/${property_id}/invoices/${id}/void`,
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
	property_id,
	id,
}: {
	property_id: string
	id: string
}) => {
	try {
		await fetchClient(`/v1/admin/properties/${property_id}/invoices/${id}`, {
			method: 'DELETE',
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

export const useDeleteInvoice = () => useMutation({ mutationFn: deleteInvoice })
