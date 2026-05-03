import { data } from 'react-router'
import type { Route } from './+types/tenant-applications.$code'
import {
	serverGetTrackingApplication,
	serverPayTrackingInvoice,
	serverSendTrackingOtp,
	serverUpdateTrackingApplication,
	serverVerifyTrackingOtp,
} from '~/api/tracking/server'
import { getDomainUrl, getDisplayUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import {
	commitTrackingSession,
	destroyTrackingSession,
	getTrackingSession,
} from '~/lib/tracking-session.server'
import { TenantApplicationTrackingModule } from '~/modules'

function buildChecklistProgress(
	application: TrackingApplication,
): TrackingApplication['checklist_progress'] {
	return {
		unit_selected: !!application.desired_unit,
		personal_details_complete: !!(
			application.first_name && application.last_name
		),
		move_in_setup_complete: !!(
			application.desired_move_in_date &&
			application.stay_duration &&
			application.stay_duration_frequency
		),
		financial_setup_complete:
			application.application_payment_invoice?.status === 'PAID' ||
			application.application_payment_invoice?.status === 'PARTIALLY_PAID',
		lease_document_ready:
			application.lease_agreement_document_status === 'SIGNED' ||
			application.lease_agreement_document_status === 'FINALIZED',
	}
}

export async function loader({ request, params }: Route.LoaderArgs) {
	const code = params.code
	const session = await getTrackingSession(request, code)
	const verifiedCode = session.get('verified_code')

	const origin = getDomainUrl(request)

	if (verifiedCode === code) {
		try {
			const result = await serverGetTrackingApplication(code)
			const application: TrackingApplication = {
				...(result.data as any),
				checklist_progress: buildChecklistProgress(result.data as any),
				lease_agreement_document_signing_url: null,
			}
			return { code, origin, application, maskedPhone: null }
		} catch {
			// Cookie valid but fetch failed — fall through to OTP screen
			const destroyHeader = await destroyTrackingSession(session, code)
			return data(
				{ code, origin, application: null, maskedPhone: null },
				{ headers: { 'Set-Cookie': destroyHeader } },
			)
		}
	}

	return { code, origin, application: null, maskedPhone: null }
}

export async function action({ request, params }: Route.ActionArgs) {
	const code = params.code
	const formData = await request.formData()
	const intent = formData.get('intent') as string

	if (intent === 'sendOtp') {
		try {
			const result = await serverSendTrackingOtp(code)
			return { maskedPhone: result.masked_phone, error: null }
		} catch (err: unknown) {
			const msg =
				err instanceof Response
					? (await err.json().catch(() => ({ error: 'Failed to send OTP' })))
						.error
					: 'Failed to send verification code'
			return { maskedPhone: null, error: msg as string }
		}
	}

	if (intent === 'verifyOtp') {
		const otpCode = formData.get('otp_code') as string
		try {
			const result = await serverVerifyTrackingOtp(code, otpCode)
			const application: TrackingApplication = {
				...(result.data as any),
				checklist_progress: buildChecklistProgress(result.data as any),
				lease_agreement_document_signing_url: null,
			}
			const session = await getTrackingSession(request, code)
			session.set('verified_code', code)
			const cookieHeader = await commitTrackingSession(session, code)
			return data(
				{ application, maskedPhone: null, error: null },
				{ headers: { 'Set-Cookie': cookieHeader } },
			)
		} catch (err: unknown) {
			let msg = 'Invalid verification code'
			if (err instanceof Response) {
				try {
					const body = await err.json()
					msg = body?.error ?? msg
				} catch {
					// ignore
				}
			}
			return { application: null, maskedPhone: null, error: msg }
		}
	}

	if (intent === 'updateApplication') {
		const session = await getTrackingSession(request, code)
		if (session.get('verified_code') !== code) {
			return {
				application: null,
				error: 'Unauthorized: please verify your identity first.',
			}
		}

		const fields = [
			'first_name',
			'last_name',
			'email',
			'phone',
			'gender',
			'date_of_birth',
			'nationality',
			'marital_status',
			'id_type',
			'id_number',
			'current_address',
			'emergency_contact_name',
			'emergency_contact_phone',
			'relationship_to_emergency_contact',
			'employer_type',
			'occupation',
			'employer',
			'occupation_address',
		] as const
		const body: Record<string, string> = {}
		for (const f of fields) {
			const val = formData.get(f)
			if (val && typeof val === 'string' && val.trim()) {
				body[f] = val.trim()
			}
		}
		try {
			const result = await serverUpdateTrackingApplication(code, body)
			const application: TrackingApplication = {
				...(result.data as any),
				checklist_progress: buildChecklistProgress(result.data as any),
				lease_agreement_document_signing_url: null,
			}
			return { application, error: null }
		} catch (err: unknown) {
			let msg = 'Failed to save changes'
			if (err instanceof Response) {
				try {
					const body = await err.json()
					console.log({ err: body })
					msg = body?.errors?.message ?? msg
				} catch {
					// ignore
				}
			}
			return { application: null, error: msg }
		}
	}

	if (intent === 'payInvoice') {
		const invoiceId = formData.get('invoice_id') as string
		const provider = formData.get('provider') as string
		const amount = Number(formData.get('amount'))
		const reference = (formData.get('reference') as string) || undefined

		try {
			await serverPayTrackingInvoice(code, invoiceId, {
				provider,
				amount,
				reference,
			})
			return { paymentSuccess: true, error: null }
		} catch (err: unknown) {
			let msg = 'Failed to submit payment'
			if (err instanceof Response) {
				try {
					const body = await err.json()
					msg = body?.error ?? msg
				} catch {
					// ignore
				}
			}
			return { paymentSuccess: false, error: msg }
		}
	}

	return { error: 'Unknown action' }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: `Track Application ${loaderData.code} | Rent-Loop`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default TenantApplicationTrackingModule
