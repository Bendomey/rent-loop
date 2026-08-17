import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient } from '~/lib/transport'

const scope = (clientId: string, propertyId: string) =>
	`/v1/admin/clients/${clientId}/properties/${propertyId}`

const unwrap = async (error: unknown): Promise<never> => {
	if (error instanceof Response) {
		const body = await error.json()
		throw new Error(body.errors?.message || 'Unknown error')
	}
	if (error instanceof Error) throw error
	throw new Error('Unknown error')
}

/**
 * GET the account with its charges.
 *
 * include_voided reveals removed charges. It never changes the totals — the
 * server excludes voided charges from every total regardless.
 */
const getFinancialAccount = async (
	clientId: string,
	propertyId: string,
	accountId: string,
	includeVoided: boolean,
) => {
	try {
		const query = includeVoided ? '?include_voided=true' : ''
		const response = await fetchClient<ApiResponse<AccountSummary>>(
			`${scope(clientId, propertyId)}/financial-accounts/${accountId}${query}`,
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const useGetFinancialAccount = (
	clientId: string,
	propertyId: string,
	accountId: Nullable<string>,
	includeVoided = false,
	initialData?: AccountSummary,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.FINANCIAL_ACCOUNT,
			clientId,
			propertyId,
			accountId,
			includeVoided,
		],
		queryFn: () =>
			getFinancialAccount(clientId, propertyId, accountId ?? '', includeVoided),
		enabled: !!clientId && !!propertyId && !!accountId,
		// Only seed the default view. Toggling include_voided changes the query
		// key, and reusing this payload there would briefly show a list with no
		// removed charges as though that were the answer.
		initialData: includeVoided ? undefined : initialData,
	})

/** POST charges:prepare — one-way. A second call returns 400. */
const prepareCharges = async ({
	client_id,
	property_id,
	application_id,
}: {
	client_id: string
	property_id: string
	application_id: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<FinancialAccount>>(
			`${scope(client_id, property_id)}/tenant-applications/${application_id}/charges:prepare`,
			{ method: 'POST' },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const usePrepareCharges = () =>
	useMutation({ mutationFn: prepareCharges })

/** POST a one-off charge. There is no edit endpoint — remove and re-add. */
const createCharge = async ({
	client_id,
	property_id,
	account_id,
	data,
}: {
	client_id: string
	property_id: string
	account_id: string
	data: {
		name: string
		category: ChargeCategory
		/**
		 * Signed. A negative amount is a refund of that category — there are
		 * deliberately no refund-specific categories.
		 */
		amount: number
		currency: string
		due_date: string
		/**
		 * Marks this as a refund of an existing charge. The refund inherits that
		 * charge's category and is capped server-side at what was actually
		 * settled — you cannot refund money never received.
		 */
		reverses_charge_instance_id?: string
	}
}) => {
	try {
		const response = await fetchClient<ApiResponse<ChargeInstance>>(
			`${scope(client_id, property_id)}/financial-accounts/${account_id}/charges`,
			{ method: 'POST', body: JSON.stringify(data) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const useCreateCharge = () => useMutation({ mutationFn: createCharge })

/**
 * PATCH charges/{id}/void — the only way to remove a charge.
 *
 * Returns 400 ChargeAlreadyBilled if an invoice has claimed it; the invoice has
 * to be voided first, which releases the claim.
 */
const voidCharge = async ({
	client_id,
	property_id,
	account_id,
	charge_id,
	reason,
}: {
	client_id: string
	property_id: string
	account_id: string
	charge_id: string
	reason: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<boolean>>(
			`${scope(client_id, property_id)}/financial-accounts/${account_id}/charges/${charge_id}/void`,
			{ method: 'PATCH', body: JSON.stringify({ reason }) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const useVoidCharge = () => useMutation({ mutationFn: voidCharge })

/** PATCH billing-policy. */
const updateBillingPolicy = async ({
	client_id,
	property_id,
	account_id,
	data,
}: {
	client_id: string
	property_id: string
	account_id: string
	data: {
		cadence: RentBillingCadence
		interval?: number
		auto_issue_days_before?: number
	}
}) => {
	try {
		const response = await fetchClient<ApiResponse<boolean>>(
			`${scope(client_id, property_id)}/financial-accounts/${account_id}/billing-policy`,
			{ method: 'PATCH', body: JSON.stringify(data) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const useUpdateBillingPolicy = () =>
	useMutation({ mutationFn: updateBillingPolicy })

/**
 * POST invoices:compose — the only way an account-backed invoice is created.
 *
 * Exactly one of claims or amount; both or neither returns 400
 * ProvideEitherClaimsOrAmount. A claim larger than the charge's uninvoiced
 * balance returns 400 ClaimExceedsChargeBalance.
 */
const composeInvoice = async ({
	client_id,
	property_id,
	account_id,
	data,
}: {
	client_id: string
	property_id: string
	account_id: string
	data: {
		claims?: Array<{ charge_instance_id: string; amount: number }>
		amount?: number
		due_date?: string
		issue: boolean
	}
}) => {
	try {
		const response = await fetchClient<ApiResponse<Invoice>>(
			`${scope(client_id, property_id)}/financial-accounts/${account_id}/invoices:compose`,
			{ method: 'POST', body: JSON.stringify(data) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const useComposeInvoice = () =>
	useMutation({ mutationFn: composeInvoice })

/**
 * POST invoices/{id}/pay — creates AND verifies the payment in one call.
 *
 * Returns 204. Paying more than the invoice's remaining balance returns 400
 * PaymentExceedsInvoiceBalance; paying less is allowed and settles the lines
 * oldest-due-first.
 */
const payInvoice = async ({
	client_id,
	property_id,
	invoice_id,
	data,
}: {
	client_id: string
	property_id: string
	invoice_id: string
	data: {
		payment_account_id: string
		amount: number
		provider: string
		reference?: string
	}
}) => {
	try {
		await fetchClient<ApiResponse<null>>(
			`${scope(client_id, property_id)}/invoices/${invoice_id}/pay`,
			{ method: 'POST', body: JSON.stringify(data) },
		)
		return true
	} catch (error: unknown) {
		return unwrap(error)
	}
}

export const usePayInvoice = () => useMutation({ mutationFn: payInvoice })
