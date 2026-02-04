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
import { getErrorMessage } from '~/lib/error-messages'
import { formatPhoneWithCountryCode } from '~/lib/misc'

export function Step2() {
	const [otp, setOtp] = useState('')
	const [otpError, setOtpError] = useState('')
	const [canResend, setCanResend] = useState(true)
	const [resendCountdown, setResendCountdown] = useState(0)

	const { goBack, goNext, goToPage, formData, updateFormData, allowEdit } =
		useTenantApplicationContext()

	const isOtpComplete = otp.length === 6

	useEffect(() => {
		let t: NodeJS.Timeout | null = null
		if (resendCountdown > 0) {
			t = setTimeout(() => setResendCountdown((s) => s - 1), 1000)
		} else if (resendCountdown === 0) {
			setCanResend(true)
		}

		return () => {
			if (t) clearTimeout(t)
		}
	}, [resendCountdown])

	const resend = () => {
		if (!canResend) setCanResend(false)
		setResendCountdown(30)
	}

	useEffect(() => {
		if (isOtpComplete) {
			void verifyAndLookUpTenant()
		}
		setOtpError('')
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
					employment_type: tenant.employment_type,
					occupation:
						tenant.employment_type === 'STUDENT'
							? tenant.employment_type
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
							{formData?.phone || 'your phone'}
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
						disabled={!canResend}
						variant="ghost"
						size="sm"
						className="text-rose-600 hover:bg-transparent hover:underline disabled:opacity-50"
						onClick={resend}
					>
						{canResend ? 'Resend code' : `Resend in ${resendCountdown}s`}
					</Button>
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
