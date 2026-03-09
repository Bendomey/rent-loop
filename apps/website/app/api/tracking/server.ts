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
