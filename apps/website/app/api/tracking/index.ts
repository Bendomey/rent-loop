import { useMutation } from '@tanstack/react-query'

// ──────────────────────────────────────────────
// Mock data — replace with real API calls later
// ──────────────────────────────────────────────

const MOCK_APPLICATION: TrackingApplication = {
	code: 'abc123',
	status: 'TenantApplication.Status.InProgress',
	first_name: 'Kwame',
	last_name: 'Mensah',
	desired_unit: {
		name: 'Unit 4B',
		type: 'APARTMENT',
		property: {
			name: 'Adabraka Heights',
			address: '12 Kojo Thompson Rd, Accra',
		},
	},
	desired_move_in_date: '2025-03-01T00:00:00Z',
	stay_duration: 12,
	stay_duration_frequency: 'MONTHLY',
	rent_fee: 1500,
	rent_fee_currency: 'GHS',
	payment_frequency: 'MONTHLY',
	initial_deposit_fee: 500,
	security_deposit_fee: 3000,
	lease_agreement_document_status: 'SIGNING',
	lease_agreement_document_signing_url: 'https://sign.example.com/doc/abc123',
	lease_agreement_document_url: null,
	application_payment_invoice: {
		code: 'INV-2501-A3X9F2',
		status: 'ISSUED',
		total_amount: 5000,
		currency: 'GHS',
		line_items: [
			{
				label: 'Security Deposit',
				category: 'SECURITY_DEPOSIT',
				total_amount: 3000,
				currency: 'GHS',
			},
			{
				label: 'Initial Deposit',
				category: 'INITIAL_DEPOSIT',
				total_amount: 500,
				currency: 'GHS',
			},
			{
				label: 'First Month Rent',
				category: 'RENT',
				total_amount: 1500,
				currency: 'GHS',
			},
		],
		paid_at: null,
		due_date: '2025-02-28T00:00:00Z',
	},
	checklist_progress: {
		unit_selected: true,
		personal_details_complete: true,
		move_in_setup_complete: true,
		financial_setup_complete: false,
		lease_document_ready: false,
	},
	created_at: '2025-01-15T09:30:00Z',
	completed_at: null,
	cancelled_at: null,
}

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

// ──────────────────────────────────────────────
// Step 1: Send OTP to the phone associated with the application
// ──────────────────────────────────────────────
export const sendTrackingOtp = async (_code: string) => {
	await delay(1000)
	return { masked_phone: '+233****4569' }
}

export const useSendTrackingOtp = () =>
	useMutation({ mutationFn: sendTrackingOtp })

// ──────────────────────────────────────────────
// Step 2: Verify OTP and get application data + access token
// ──────────────────────────────────────────────
export const verifyTrackingOtp = async ({
	code,
}: {
	code: string
	otpCode: string
}) => {
	await delay(1200)
	return {
		access_token: 'mock-token-' + code,
		application: { ...MOCK_APPLICATION, code },
	}
}

export const useVerifyTrackingOtp = () =>
	useMutation({ mutationFn: verifyTrackingOtp })

// ──────────────────────────────────────────────
// Step 3: Fetch tracking data with stored access token
// ──────────────────────────────────────────────
export const getTrackingApplication = async (
	code: string,
	_accessToken: string,
) => {
	await delay(800)
	return { ...MOCK_APPLICATION, code }
}
