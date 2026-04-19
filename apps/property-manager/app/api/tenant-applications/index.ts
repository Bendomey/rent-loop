import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

/**
 * GET all tenant applications based on a query.
 */

const getPropertyTenantApplications = async (
	clientId: string,
	propertyId: string,
	props: FetchMultipleDataInputParams<FetchTenantApplicationFilter>,
) => {
	try {
		const params = getQueryParams<FetchTenantApplicationFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<TenantApplication>>
		>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/tenant-applications?${params.toString()}`,
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

export const useGetPropertyTenantApplications = (
	clientId: string,
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchTenantApplicationFilter>,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.PROPERTY_TENANT_APPLICATIONS,
			clientId,
			propertyId,
			query,
		],
		queryFn: () => getPropertyTenantApplications(clientId, propertyId, query),
		enabled: !!propertyId && !!clientId,
	})

interface AdminGetPropertyTenantApplicationProps {
	id: string
	property_id: string
	populate?: Array<string>
}

export const getAdminPropertyTenantApplicationForServer = async (
	clientId: string,
	input: AdminGetPropertyTenantApplicationProps,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const params = getQueryParams({
			populate: input.populate,
		})
		const response = await fetchServer<ApiResponse<TenantApplication>>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/properties/${input.property_id}/tenant-applications/${input.id}?${params.toString()}`,
			{
				method: 'GET',
				...apiConfig,
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

interface GetPropertyTenantApplicationProps {
	id: string
	populate?: Array<string>
}

export const getPropertyTenantApplicationForServer = async (
	input: GetPropertyTenantApplicationProps,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const params = getQueryParams({
			populate: input.populate,
		})
		const response = await fetchServer<ApiResponse<TenantApplication>>(
			`${apiConfig.baseUrl}/v1/tenant-applications/${input.id}?${params.toString()}`,
			{
				method: 'GET',
				...apiConfig,
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

export interface CreatePropertyTenantApplicationInput {
	client_id: string
	property_id: string
	desired_unit_id: string
	desired_unit?: string
	on_boarding_method: TenantApplication['on_boarding_method']
	first_name: string
	other_names: Maybe<string>
	last_name: string
	email: string
	phone: string
	gender: TenantApplication['gender']
	marital_status: TenantApplication['marital_status']
	profile_photo_url: Maybe<string>
	date_of_birth: string
	current_address: string

	// Identity
	nationality: string
	id_type: Maybe<TenantApplication['id_type']>
	id_number: string
	id_front_url: Nullable<string>
	id_back_url: Nullable<string>

	// Emergency_Contact
	emergency_contact_name: string
	emergency_contact_phone: string
	relationship_to_emergency_contact: string

	// Occupation_Details
	employer_type: TenantApplication['employer_type']
	occupation: string
	employer: string
	occupation_address: string
	proof_of_income_url: Nullable<string>
}

export const createTenantApplication = async (
	props: CreatePropertyTenantApplicationInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<TenantApplication>>(
			`${apiConfig?.baseUrl}/v1/admin/clients/${props.client_id}/properties/${props.property_id}/tenant-applications`,
			{
				method: 'POST',
				body: JSON.stringify(props),
				...(apiConfig ? apiConfig : {}),
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

/**
 * Invite tenant to a property.
 */
const inviteTenantToProperty = async (props: {
	client_id: string
	property_id: string
	unit_id: string
	email: Maybe<string>
	phone: Maybe<string>
}) => {
	try {
		const { client_id, property_id, ...body } = props
		await fetchClient(
			`/v1/admin/clients/${client_id}/properties/${property_id}/tenant-applications/invite`,
			{
				method: 'POST',
				body: JSON.stringify(body),
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

export const useInviteTenateToProperty = () =>
	useMutation({
		mutationFn: inviteTenantToProperty,
	})

interface cancelTenantApplicationProps {
	client_id: string
	property_id: string
	id: string
	reason: string
}

/**
 * Cancel Tenant Application
 */
const cancelTenantApplication = async ({
	client_id,
	property_id,
	id,
	reason,
}: cancelTenantApplicationProps) => {
	try {
		const response = await fetchClient<ApiResponse<TenantApplication>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/tenant-applications/${id}/cancel`,
			{
				method: 'PATCH',
				body: JSON.stringify({ reason }),
			},
		)
		return response.parsedBody.data
	} catch (error) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}
export const useCancelTenantApplication = () =>
	useMutation({ mutationFn: cancelTenantApplication })

/**
 * approve tenant application
 */

const approveTenantApplication = async ({
	client_id,
	property_id,
	id,
}: {
	client_id: string
	property_id: string
	id: string
}) => {
	try {
		await fetchClient<boolean>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/tenant-applications/${id}/approve`,
			{
				method: 'PATCH',
			},
		)
	} catch (error) {
		if (error instanceof Error) {
			throw error
		}

		// Error from server.
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.message)
		}
	}
}

export const useApproveTenantApplication = () =>
	useMutation({ mutationFn: approveTenantApplication })

/**
 * Delete Tenant Application
 */
const deleteTenantApplication = async (props: {
	client_id: string
	property_id: string
	id: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${props.client_id}/properties/${props.property_id}/tenant-applications/${props.id}`,
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

export const useDeleteTenantApplication = () =>
	useMutation({
		mutationFn: deleteTenantApplication,
	})

/**
 * Update Admin Tenant Application
 */
interface AdminUpdateTenantApplicationProps {
	client_id: string
	property_id: string
	id: string
	data: Partial<TenantApplication>
}

const adminUpdateTenantApplication = async ({
	client_id,
	property_id,
	id,
	data,
}: AdminUpdateTenantApplicationProps) => {
	try {
		const response = await fetchClient<ApiResponse<TenantApplication>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/tenant-applications/${id}`,
			{
				method: 'PATCH',
				body: JSON.stringify(data),
			},
		)
		return response.parsedBody.data
	} catch (error) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}

export const useAdminUpdateTenantApplication = () =>
	useMutation({ mutationFn: adminUpdateTenantApplication })

/**
 * Update Tenant Application
 */
interface UpdateTenantApplicationProps {
	id: string
	data: Partial<TenantApplication>
}

const updateTenantApplication = async ({
	id,
	data,
}: UpdateTenantApplicationProps) => {
	try {
		const response = await fetchClient<ApiResponse<TenantApplication>>(
			`/v1/tenant-applications/${id}`,
			{
				method: 'PATCH',
				body: JSON.stringify(data),
			},
		)
		return response.parsedBody.data
	} catch (error) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}

export const useUpdateTenantApplication = () =>
	useMutation({ mutationFn: updateTenantApplication })

/**
 * Generate application payment invoice
 * Backend derives rent_fee, payment_frequency, periods etc. from the saved
 * tenant application fields. Only an optional due_date can be provided.
 */
interface GenerateApplicationPaymentInvoiceInput {
	client_id: string
	property_id: string
	id: string
	due_date?: string
}

const generateApplicationPaymentInvoice = async ({
	client_id,
	property_id,
	id,
	due_date,
}: GenerateApplicationPaymentInvoiceInput) => {
	try {
		const response = await fetchClient<ApiResponse<Invoice>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/tenant-applications/${id}/invoice:generate`,
			{
				method: 'POST',
				body: JSON.stringify(due_date ? { due_date } : {}),
			},
		)
		return response.parsedBody.data
	} catch (error) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) {
			throw error
		}
	}
}

export const useGenerateApplicationPaymentInvoice = () =>
	useMutation({ mutationFn: generateApplicationPaymentInvoice })

/**
 * Pay (record an offline payment for) an application invoice.
 */
type PaymentProvider =
	| 'MTN'
	| 'VODAFONE'
	| 'AIRTELTIGO'
	| 'PAYSTACK'
	| 'BANK_API'
	| 'CASH'

interface PayApplicationInvoiceInput {
	client_id: string
	property_id: string
	tenant_application_id: string
	invoice_id: string
	body: {
		amount: number
		payment_account_id: string
		provider: PaymentProvider
		reference?: string
		metadata?: Record<string, unknown>
	}
}

const payApplicationInvoice = async ({
	client_id,
	property_id,
	tenant_application_id,
	invoice_id,
	body,
}: PayApplicationInvoiceInput) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${client_id}/properties/${property_id}/tenant-applications/${tenant_application_id}/invoice/${invoice_id}/pay`,
			{
				method: 'POST',
				body: JSON.stringify(body),
			},
		)
	} catch (error) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) {
			throw error
		}
	}
}

export const usePayApplicationInvoice = () =>
	useMutation({ mutationFn: payApplicationInvoice })

/**
 * Bulk create tenant applications from CSV/Excel upload.
 */
export interface BulkCreateTenantApplicationEntry {
	phone: string
	first_name?: string
	last_name?: string
	email?: string
	gender?: string
	date_of_birth?: string
	nationality?: string
	marital_status?: string
	id_type?: string
	id_number?: string
	current_address?: string
	desired_unit_id?: string
	occupation?: string
	employer?: string
}

interface BulkCreateTenantApplicationsInput {
	client_id: string
	property_id: string
	entries: BulkCreateTenantApplicationEntry[]
}

const bulkCreateTenantApplications = async ({
	client_id,
	property_id,
	entries,
}: BulkCreateTenantApplicationsInput) => {
	try {
		const response = await fetchClient<ApiResponse<TenantApplication[]>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/tenant-applications/bulk`,
			{
				method: 'POST',
				body: JSON.stringify({ entries }),
			},
		)
		return response.parsedBody.data
	} catch (error) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) {
			throw error
		}
	}
}

export const useBulkCreateTenantApplications = () =>
	useMutation({ mutationFn: bulkCreateTenantApplications })
