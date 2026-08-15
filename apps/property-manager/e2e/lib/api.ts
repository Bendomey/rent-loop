/**
 * Thin typed client over the Go API, used for the *prerequisites* of a case —
 * never for the thing under test. Building a property through the UI wizard in
 * order to reach an unrelated screen is how E2E suites become slow and flaky,
 * so setup goes through here and the browser only drives what is being tested.
 */

export const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:5003'
export const WEB_BASE = process.env.E2E_WEB_URL ?? 'http://localhost:3000'

export const CREDENTIALS = {
	email: process.env.E2E_EMAIL ?? 'domeybenjamin1@gmail.com',
	password: process.env.E2E_PASSWORD ?? 'pineapple',
}

export interface LoginResult {
	token: string
	clientId: string
	clientName: string
}

interface ApiClientUser {
	role: string
	status: string
	client: { id: string; name: string; type: string; sub_type: string }
}

async function call<T>(
	method: string,
	path: string,
	opts: { token?: string; body?: unknown } = {},
): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
		},
		...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
	})

	const text = await res.text()
	if (!res.ok) {
		throw new Error(`${method} ${path} -> ${res.status}\n${text.slice(0, 600)}`)
	}
	return (text ? JSON.parse(text) : {}) as T
}

/**
 * Logs in and resolves which client (workspace) the suite operates in.
 *
 * The account belongs to more than one client, and the UI makes you pick one
 * after login. The suite must create its property under the *same* client the
 * browser session selects, or every page it navigates to 404s. Set
 * E2E_CLIENT_ID to pin a specific workspace; otherwise the first active
 * membership wins, which is stable for a given account.
 */
export async function login(): Promise<LoginResult> {
	const res = await call<{
		data: { token: string; user: { client_users: ApiClientUser[] } }
	}>('POST', '/api/v1/admin/users/login', { body: CREDENTIALS })

	const memberships = res.data.user.client_users.filter(
		(cu) => cu.status === 'ClientUser.Status.Active',
	)
	if (memberships.length === 0) {
		throw new Error('login succeeded but the account has no active workspace')
	}

	const pinned = process.env.E2E_CLIENT_ID
	const chosen = pinned
		? memberships.find((m) => m.client.id === pinned)
		: memberships[0]

	if (!chosen) {
		throw new Error(
			`E2E_CLIENT_ID=${pinned} is not a workspace this account belongs to. ` +
				`Available: ${memberships.map((m) => `${m.client.id} (${m.client.name})`).join(', ')}`,
		)
	}

	return {
		token: res.data.token,
		clientId: chosen.client.id,
		clientName: chosen.client.name,
	}
}

const clientPath = (clientId: string) => `/api/v1/admin/clients/${clientId}`

export interface Property {
	id: string
	name: string
	slug: string
	modes?: string[] | null
}

/**
 * Without LEASE in `modes`, every route under /occupancy throws a 404 — the
 * applications layout gates on `property.modes.includes('LEASE')`. `modes` is
 * optional when creating a property, so omitting it yields a property that
 * looks fine on its overview page and 404s everywhere the suite needs to go.
 */
export const REQUIRED_MODES = ['LEASE']

export async function setPropertyModes(
	token: string,
	clientId: string,
	propertyId: string,
	modes: string[],
): Promise<void> {
	await call('PATCH', `${clientPath(clientId)}/properties/${propertyId}`, {
		token,
		body: { modes },
	})
}

export async function listProperties(
	token: string,
	clientId: string,
): Promise<Property[]> {
	const res = await call<{ data: { meta: unknown; rows: Property[] | null } }>(
		'GET',
		`${clientPath(clientId)}/properties?limit=200`,
		{ token },
	)

	// List endpoints return `data: { meta, rows }`. Getting this wrong is not a
	// loud failure — an empty result makes find-or-create silently create a
	// duplicate on every run — so assert the shape instead of defaulting to [].
	const rows = res.data?.rows
	if (rows === undefined) {
		throw new Error(
			`Unexpected properties list shape: expected data.rows, got keys ` +
				`[${Object.keys(res.data ?? {}).join(', ')}]`,
		)
	}
	return rows ?? []
}

export async function createProperty(
	token: string,
	clientId: string,
	name: string,
): Promise<Property> {
	const res = await call<{ data: Property }>(
		'POST',
		`${clientPath(clientId)}/properties`,
		{
			token,
			body: {
				name,
				type: 'MULTI',
				status: 'Property.Status.Active',
				modes: REQUIRED_MODES,
				address: 'E2E Street',
				city: 'Accra',
				region: 'Greater Accra',
				country: 'Ghana',
				latitude: 5.6037,
				longitude: -0.187,
				description: 'Created by the browser E2E suite. Safe to delete.',
			},
		},
	)
	return res.data
}

export async function createBlock(
	token: string,
	clientId: string,
	propertyId: string,
	name: string,
): Promise<{ id: string }> {
	const res = await call<{ data: { id: string } }>(
		'POST',
		`${clientPath(clientId)}/properties/${propertyId}/blocks`,
		{ token, body: { name, status: 'PropertyBlock.Status.Active' } },
	)
	return res.data
}

export interface Unit {
	id: string
	name: string
	slug: string
}

export async function createUnit(
	token: string,
	clientId: string,
	propertyId: string,
	blockId: string,
	opts: { name: string; rentFee: number; paymentFrequency?: string },
): Promise<Unit> {
	const res = await call<{ data: Unit }>(
		'POST',
		`${clientPath(clientId)}/properties/${propertyId}/blocks/${blockId}/units`,
		{
			token,
			body: {
				name: opts.name,
				type: 'APARTMENT',
				status: 'Unit.Status.Available',
				rent_fee: opts.rentFee,
				rent_fee_currency: 'GHS',
				payment_frequency: opts.paymentFrequency ?? 'MONTHLY',
				max_occupants_allowed: 1,
			},
		},
	)
	return res.data
}

export interface Application {
	id: string
	code: string
}

export async function createApplication(
	token: string,
	clientId: string,
	propertyId: string,
	opts: {
		unitId: string
		firstName: string
		lastName: string
		phone: string
		/** Populate every field ApproveTenantApplication insists on. */
		approvable?: boolean
		email?: string
		idNumber?: string
	},
): Promise<Application> {
	const res = await call<{ data: Application }>(
		'POST',
		`${clientPath(clientId)}/properties/${propertyId}/tenant-applications`,
		{
			token,
			body: {
				desired_unit_id: opts.unitId,
				first_name: opts.firstName,
				last_name: opts.lastName,
				phone: opts.phone,
				gender: 'MALE',
				...(opts.approvable
					? {
							email: opts.email,
							date_of_birth: '1995-06-15T00:00:00Z',
							nationality: 'Ghanaian',
							marital_status: 'SINGLE',
							current_address: '12 E2E Road, Accra',
							id_type: 'GHANA_CARD',
							id_number: opts.idNumber ?? 'GHA-E2E-000',
							emergency_contact_name: 'E2E Kin',
							emergency_contact_phone: '+233544000111',
							relationship_to_emergency_contact: 'Sibling',
							employer_type: 'WORKER',
							occupation: 'Engineer',
							employer: 'E2E Ltd',
							occupation_address: '9 Work Street, Accra',
						}
					: {}),
			},
		},
	)
	return res.data
}

/**
 * Voids an invoice.
 *
 * Done through the API because the PM UI has no affordance for it on
 * charge-derived invoices: `useVoidInvoice` is wired only into the expenses tab
 * and booking payments, and on the financials invoice list "Void" appears only
 * as a status *filter*. The behaviour under test in c4 is therefore what the
 * screens show once an invoice is voided, not the act of voiding.
 */
export async function voidInvoice(
	token: string,
	clientId: string,
	propertyId: string,
	invoiceId: string,
): Promise<void> {
	await call(
		'PATCH',
		`${clientPath(clientId)}/properties/${propertyId}/invoices/${invoiceId}/void`,
		{ token, body: { reason: 'E2E void' } },
	)
}

export interface Invoice {
	id: string
	code: string
	status: string
}

/**
 * Invoices billed to a lease, newest first.
 *
 * The filter is `payer_lease_id`, not `lease_id`. Unrecognised query params are
 * ignored rather than rejected, so the wrong name returns every invoice on the
 * property and the caller cannot tell — which reads as "billing created four
 * invoices" instead of "your filter did nothing".
 */
export async function listLeaseInvoices(
	token: string,
	clientId: string,
	propertyId: string,
	leaseId: string,
): Promise<Invoice[]> {
	const res = await call<{ data: { rows: Invoice[] | null } }>(
		'GET',
		`${clientPath(clientId)}/properties/${propertyId}/invoices?payer_lease_id=${leaseId}&limit=50`,
		{ token },
	)
	return res.data?.rows ?? []
}

/** Adds a charge directly to an account. */
export async function createCharge(
	token: string,
	clientId: string,
	propertyId: string,
	accountId: string,
	opts: { name: string; category: string; amount: number; dueDate?: string },
): Promise<ChargeRow> {
	const res = await call<{ data: ChargeRow }>(
		'POST',
		`${clientPath(clientId)}/properties/${propertyId}/financial-accounts/${accountId}/charges`,
		{
			token,
			body: {
				name: opts.name,
				category: opts.category,
				amount: opts.amount,
				// Required, and not defaulted from the account despite the account
				// carrying one — omitting it returns 422, not a currency mismatch.
				currency: 'GHS',
				due_date: opts.dueDate ?? new Date().toISOString(),
			},
		},
	)
	return res.data
}

/**
 * Composes an invoice claiming specific charges, and issues it.
 *
 * Enough to make a charge *dirty* on its own — `HasDirtyInstances` treats a
 * non-zero invoiced_amount the same as a settled one, so this reaches the
 * guard's precondition without needing a payment.
 */
export async function composeInvoice(
	token: string,
	clientId: string,
	propertyId: string,
	accountId: string,
	claims: Array<{ charge_instance_id: string; amount: number }>,
): Promise<Invoice> {
	const res = await call<{ data: Invoice }>(
		'POST',
		`${clientPath(clientId)}/properties/${propertyId}/financial-accounts/${accountId}/invoices:compose`,
		{ token, body: { claims, issue: true } },
	)
	return res.data
}

export interface PaymentAccount {
	id: string
	rail: string
}

/**
 * Find-or-create a payment account for the workspace.
 *
 * The Record-a-payment dialog requires one ("Received into") and keeps its
 * submit disabled until an account is chosen, so a case that records a payment
 * cannot run without this. Created once and reused, like the property — an
 * account per run would clutter the client's real settings.
 */
export async function ensurePaymentAccount(
	token: string,
	clientId: string,
): Promise<PaymentAccount> {
	const list = await call<{ data: { rows: PaymentAccount[] | null } }>(
		'GET',
		`${clientPath(clientId)}/payment-accounts?limit=50`,
		{ token },
	)
	const existing = (list.data?.rows ?? []).find((a) => a.rail === 'OFFLINE')
	if (existing) return existing

	const res = await call<{ data: PaymentAccount }>(
		'POST',
		`${clientPath(clientId)}/payment-accounts`,
		{
			token,
			body: {
				rail: 'OFFLINE',
				identifier: 'E2E Cash Desk',
				status: 'ACTIVE',
				is_default: true,
			},
		},
	)
	return res.data
}

export interface Lease {
	id: string
	code: string
	status: string
}

/** Approves the application and returns the lease it created. */
export async function approveApplication(
	token: string,
	clientId: string,
	propertyId: string,
	applicationId: string,
): Promise<Lease> {
	const res = await call<{ data: Lease }>(
		'PATCH',
		`${clientPath(clientId)}/properties/${propertyId}/tenant-applications/${applicationId}/approve`,
		{ token },
	)
	return res.data
}

/**
 * Moves an application to a different unit.
 *
 * Separate from setApplicationTerms because the service treats it differently:
 * `rentTermsChanged()` lists rent, currency, move-in date, stay duration and
 * payment frequency — but not the unit — so this path triggers no rederive and
 * no dirty-charge check today. Group F exists to pin what it should do.
 */
export async function setApplicationUnit(
	token: string,
	clientId: string,
	propertyId: string,
	applicationId: string,
	unitId: string,
): Promise<void> {
	await call(
		'PATCH',
		`${clientPath(clientId)}/properties/${propertyId}/tenant-applications/${applicationId}`,
		{ token, body: { desired_unit_id: unitId } },
	)
}

export interface ChargeRow {
	id: string
	name: string
	category: string
	amount: number
	due_date: string
	invoiced_amount: number
	settled_amount: number
}

/**
 * The account id an application hangs off. There is no
 * /tenant-applications/{id}/financial-account route — the account arrives
 * embedded in the application response instead.
 */
export async function getApplicationAccountId(
	token: string,
	clientId: string,
	propertyId: string,
	applicationId: string,
): Promise<string> {
	const res = await call<{
		data: { financial_account: { id: string } | null }
	}>(
		'GET',
		`${clientPath(clientId)}/properties/${propertyId}/tenant-applications/${applicationId}`,
		{ token },
	)
	const id = res.data?.financial_account?.id
	if (!id) throw new Error('application has no financial account')
	return id
}

/**
 * Account detail including the denormalised `property_id` the Cube resolves an
 * invoice's property through, and the charge ledger.
 */
export async function getAccount(
	token: string,
	clientId: string,
	propertyId: string,
	accountId: string,
): Promise<{
	account: { id: string; code: string; property_id: string | null }
	charges: ChargeRow[]
}> {
	const res = await call<{
		data: {
			account: { id: string; code: string; property_id: string | null }
			charges: ChargeRow[] | null
		}
	}>(
		'GET',
		`${clientPath(clientId)}/properties/${propertyId}/financial-accounts/${accountId}`,
		{ token },
	)
	return { account: res.data.account, charges: res.data.charges ?? [] }
}

/**
 * Derives the rent/deposit charges from the application's terms.
 *
 * The API would approve without this, but the UI will not: the Approve button
 * stays disabled until the "Financial setup" step reports charges, so a case
 * that only sets terms finds an application it cannot approve through the
 * screen. Takes no body — the terms set above are the input.
 */
export async function prepareCharges(
	token: string,
	clientId: string,
	propertyId: string,
	applicationId: string,
): Promise<void> {
	await call(
		'POST',
		`${clientPath(clientId)}/properties/${propertyId}/tenant-applications/${applicationId}/charges:prepare`,
		{ token },
	)
}

/**
 * Sets the terms approval requires but application *creation* does not carry:
 * rent, move-in date and stay duration. Without these,
 * ApproveTenantApplication rejects with ApplicationMissingRentDetails /
 * ApplicationMissingMoveInDate / ApplicationMissingStayDuration.
 */
export async function setApplicationTerms(
	token: string,
	clientId: string,
	propertyId: string,
	applicationId: string,
	opts: {
		rentFee: number
		moveInDate: string
		stayDuration: number
		stayDurationFrequency?: string
	},
): Promise<void> {
	await call(
		'PATCH',
		`${clientPath(clientId)}/properties/${propertyId}/tenant-applications/${applicationId}`,
		{
			token,
			body: {
				rent_fee: opts.rentFee,
				rent_fee_currency: 'GHS',
				desired_move_in_date: opts.moveInDate,
				stay_duration: opts.stayDuration,
				stay_duration_frequency: opts.stayDurationFrequency ?? 'MONTHLY',
			},
		},
	)
}
