import { environmentVariables } from '~/lib/actions/env.server'
import { fetchServer } from '~/lib/transport'

function apiUrl(path: string) {
	return `${environmentVariables().API_ADDRESS}${path}`
}

export async function serverSendTrackingOtp(
	code: string,
): Promise<{ masked_phone: string }> {
	const res = await fetchServer<{ masked_phone: string }>(
		apiUrl(`/v1/tenant-applications/code/${code}/otp:send`),
		{ method: 'POST', isUnAuthorizedRequest: true },
	)
	return res.parsedBody
}

export async function serverVerifyTrackingOtp(
	code: string,
	otpCode: string,
): Promise<{ data: TrackingApplication }> {
	const res = await fetchServer<{ data: TrackingApplication }>(
		apiUrl(`/v1/tenant-applications/code/${code}/otp:verify`),
		{
			method: 'POST',
			isUnAuthorizedRequest: true,
			body: JSON.stringify({ otp_code: otpCode }),
		},
	)
	return res.parsedBody
}

export async function serverGetTrackingApplication(
	code: string,
): Promise<{ data: TrackingApplication }> {
	const res = await fetchServer<{ data: TrackingApplication }>(
		apiUrl(`/v1/tenant-applications/code/${code}`),
		{ method: 'GET', isUnAuthorizedRequest: true },
	)
	return res.parsedBody
}

export interface UpdateTrackingApplicationInput {
	first_name?: string
	last_name?: string
	email?: string
	phone?: string
	gender?: string
	date_of_birth?: string
	nationality?: string
	marital_status?: string
	id_type?: string
	id_number?: string
	current_address?: string
	emergency_contact_name?: string
	emergency_contact_phone?: string
	relationship_to_emergency_contact?: string
	occupation?: string
	employer?: string
	occupation_address?: string
}

export async function serverUpdateTrackingApplication(
	code: string,
	body: UpdateTrackingApplicationInput,
): Promise<{ data: TrackingApplication }> {
	const res = await fetchServer<{ data: TrackingApplication }>(
		apiUrl(`/v1/tenant-applications/code/${code}`),
		{
			method: 'PATCH',
			isUnAuthorizedRequest: true,
			body: JSON.stringify(body),
		},
	)
	return res.parsedBody
}

export async function serverPayTrackingInvoice(
	code: string,
	invoiceId: string,
	body: { provider: string; amount: number; reference?: string },
): Promise<{ data: unknown }> {
	const res = await fetchServer<{ data: unknown }>(
		apiUrl(`/v1/tenant-applications/code/${code}/invoice/${invoiceId}/pay`),
		{
			method: 'POST',
			isUnAuthorizedRequest: true,
			body: JSON.stringify(body),
		},
	)
	return res.parsedBody
}
