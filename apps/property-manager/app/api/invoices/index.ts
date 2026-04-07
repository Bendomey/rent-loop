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
