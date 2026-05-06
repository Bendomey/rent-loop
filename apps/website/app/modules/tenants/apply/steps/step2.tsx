import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTenantApplicationContext } from '../context'
import { useVerifyOtpCode } from '~/api/auth'
import { useGetTenantByPhone } from '~/api/tenants'
import { Button } from '~/components/ui/button'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '~/components/ui/input-otp'
import { Spinner } from '~/components/ui/spinner'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { useSendOtp } from '~/hooks/use-send-otp'
import { getErrorMessage } from '~/lib/error-messages'
import { formatPhoneWithCountryCode } from '~/lib/misc'

export function Step2() {
	const [otp, setOtp] = useState('')
	const [otpError, setOtpError] = useState('')
	const [resendCountdown, setResendCountdown] = useState(60)
	const [resendAttempts, setResendAttempts] = useState(1)

	const { goBack, goNext, goToPage, formData, updateFormData, allowEdit } =
		useTenantApplicationContext()
	const { sendOtp, isSendingOtp } = useSendOtp()

	const isOtpComplete = otp.length === 6

	const canResend = resendCountdown === 0

	useEffect(() => {
		if (resendCountdown <= 0) return

		const t = setTimeout(() => {
			setResendCountdown((s) => s - 1)
		}, 1000)

		return () => clearTimeout(t)
	}, [resendCountdown])

	const resend = () => {
		if (!canResend) return

		const nextResend = Math.min(30 * 2 ** resendAttempts, 300)

		setResendAttempts((a) => a + 1)
		setResendCountdown(nextResend)
		sendOtp(formData.phone)
	}

	useEffect(() => {
		if (isOtpComplete) {
			void verifyAndLookUpTenant()
		}
		setOtpError('')
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOtpComplete])

	const { mutate, isPending } = useVerifyOtpCode()

	const verifyAndLookUpTenant = async () => {
		if (!isOtpComplete) {
			toast.error(`Please enter a 6-digit OTP code.`)
		}

		mutate(
			{
				code: otp,
				phone: formatPhoneWithCountryCode(formData.phone, '+233', 9),
			},
			{
				onError: (e: unknown) => {
					if (e instanceof Error) {
						const error = getErrorMessage(
							e.message,
							`Failed to verify OTP. Try again later.`,
						)
						toast.error(error)
						setOtpError(error)
					}
				},
				onSuccess: async () => {
					await tenantLookUpByPhoneAndFormUpdate()
					toast.success(`OTP has been verified`)
				},
			},
		)
	}

	const { mutate: getTenantMutate, isPending: isTenantLookupPending } =
		useGetTenantByPhone()

	const tenantLookUpByPhoneAndFormUpdate = async () => {
		const phone = formatPhoneWithCountryCode(formData.phone, '+233', 9)
		getTenantMutate(phone, {
			onError: () => {
				allowEdit(true)
				goNext()
			},
			onSuccess: (tenant) => {
				if (!tenant) {
					allowEdit(true)
					goNext()
					return
				}
				updateFormData({
					// step3 data
					first_name: tenant.first_name,
					other_names: tenant.other_names,
					last_name: tenant.last_name,
					email: tenant.email,
					phone: tenant.phone,
					current_address: tenant.current_address,
					profile_photo_url: tenant.profile_photo_url,
					date_of_birth: tenant.date_of_birth?.toString(),
					gender: tenant.gender,
					marital_status: tenant.marital_status,

					// step4 data
					nationality: tenant.nationality,
					id_type: tenant.id_type,
					id_number: tenant.id_number,
					id_front_url: tenant.id_front_url,
					id_back_url: tenant.id_back_url,

					// step5 data
					emergency_contact_name: tenant.emergency_contact_name,
					relationship_to_emergency_contact:
						tenant.relationship_to_emergency_contact,
					emergency_contact_phone: tenant.emergency_contact_phone,
					employer_type: tenant.employer_type,
					occupation:
						tenant.employer_type === 'STUDENT'
							? tenant.employer_type
							: tenant.occupation,
					employer: tenant.employer,
					occupation_address: tenant.occupation_address,
					proof_of_income_url: tenant.proof_of_income_url,
				})
				goToPage(6)
			},
		})
	}

	const isLoading = isPending || isTenantLookupPending

	return (
		<div className="mx-auto flex w-full items-center justify-center md:max-w-2xl">
			<div className="w-full max-w-xl rounded-2xl border bg-white p-12 shadow-sm md:p-8">
				{/* Header */}
				<div className="space-y-2 text-center">
					<TypographyH2 className="text-lg font-semibold">
						Verify your phone number
					</TypographyH2>
					<TypographyMuted className="leading-relaxed">
						Enter the 6-digit code sent to{' '}
						<span className="font-medium text-zinc-900">
							{formatPhoneWithCountryCode(formData.phone, '+233', 9) ||
								'your phone'}
						</span>
					</TypographyMuted>
				</div>

				{/* OTP Input */}
				<div className="mt-8 flex justify-center">
					<InputOTP
						maxLength={6}
						pattern={REGEXP_ONLY_DIGITS}
						value={otp}
						onChange={(v: any) => setOtp(v)}
					>
						<InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:text-lg sm:*:data-[slot=input-otp-slot]:h-14 sm:*:data-[slot=input-otp-slot]:w-16 sm:*:data-[slot=input-otp-slot]:text-xl">
							<InputOTPSlot index={0} aria-invalid={!!otpError} />
							<InputOTPSlot index={1} aria-invalid={!!otpError} />
							<InputOTPSlot index={2} aria-invalid={!!otpError} />
							<InputOTPSlot index={3} aria-invalid={!!otpError} />
							<InputOTPSlot index={4} aria-invalid={!!otpError} />
							<InputOTPSlot index={5} aria-invalid={!!otpError} />
						</InputOTPGroup>
					</InputOTP>
				</div>
				<div className="mt-4 text-center">
					{otpError && (
						<TypographySmall className="text-destructive">
							{otpError}
						</TypographySmall>
					)}
				</div>

				{/* Resend */}
				<div className="mt-6 flex justify-center">
					<Button
						type="button"
						disabled={!canResend || isSendingOtp}
						variant="ghost"
						size="sm"
						className="text-rose-600 hover:bg-transparent hover:underline disabled:opacity-50"
						onClick={resend}
					>
						{isSendingOtp ? <Spinner /> : null}
						{canResend ? 'Resend code' : `Resend in ${resendCountdown}s`}
					</Button>
				</div>

				{/* USSD fallback */}
				<div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-center">
					<TypographySmall className="font-semibold text-zinc-800">
						Didn&apos;t receive the code?
					</TypographySmall>
					<TypographyMuted className="mt-1 text-xs leading-relaxed">
						Dial the USSD code below to retrieve it:
					</TypographyMuted>
					<div className="mt-3 flex justify-center">
						<button
							type="button"
							onClick={() => {
								void navigator.clipboard.writeText('*713*882#')
							}}
							className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2 text-rose-600 transition-colors hover:bg-rose-100"
						>
							<span className="text-base font-extrabold tracking-widest">
								*713*882#
							</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
								<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
							</svg>
						</button>
					</div>
					<TypographyMuted className="mt-2 text-xs text-zinc-400">
						Works on all networks in Ghana
					</TypographyMuted>
				</div>

				<div className="mt-10 flex flex-col-reverse gap-3 border-t pt-6 md:flex-row md:justify-between">
					<Button
						disabled={isLoading}
						onClick={goBack}
						type="button"
						size="lg"
						variant="outline"
						className="w-full md:w-auto"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back
					</Button>

					<Button
						size="lg"
						variant="default"
						onClick={verifyAndLookUpTenant}
						disabled={!isOtpComplete || isLoading}
						className="w-full bg-rose-600 hover:bg-rose-700 md:w-auto"
					>
						{isLoading ? <Spinner /> : null}
						Verify code
						<ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
