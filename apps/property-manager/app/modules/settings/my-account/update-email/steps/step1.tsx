import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useUpdateClientEmailContext } from '../context'
import { useVerifyOtpCode } from '~/api/auth'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Step1() {
	const { goBack, goNext, onSubmit, updateFormData, formData } =
		useUpdateClientEmailContext()
	const [newEmail, setNewEmail] = useState(
		formData.newEmail ?? formData.email ?? '',
	)
	const [otp, setOtp] = useState('')
	const [otpError, setOtpError] = useState('')
	const [emailError, setEmailError] = useState('')
	const [resendCountdown, setResendCountdown] = useState(0)
	const [isOtpSent, setIsOtpSent] = useState(false)

	const { sendOtp, isSendingOtp } = useSendOtp()
	const { mutate, isPending } = useVerifyOtpCode()
	const isOtpComplete = otp.length === 6
	const canResend = resendCountdown === 0 && isOtpSent

	useEffect(() => {
		if (resendCountdown <= 0) return
		const timer = window.setTimeout(
			() => setResendCountdown((s) => s - 1),
			1000,
		)
		return () => window.clearTimeout(timer)
	}, [resendCountdown])

	useEffect(() => {
		if (isOtpComplete) {
			void handleVerify()
		}
		setOtpError('')
		setEmailError('')
	}, [isOtpComplete])

	const handleSendOtp = () => {
		if (!emailRegex.test(newEmail)) {
			setOtpError('Please enter a valid email address to send OTP')
			return
		}
		setOtpError('')
		setIsOtpSent(true)
		setResendCountdown(60)
		sendOtp({ channel: 'EMAIL', email: newEmail })
	}

	const handleResend = () => {
		if (!canResend) return
		setResendCountdown(60)
		setOtp('')
		sendOtp({ channel: 'EMAIL', email: newEmail })
	}

	const handleVerify = async () => {
		if (!emailRegex.test(newEmail)) {
			setOtpError('Please enter a valid email address')
			return
		}
		if (!isOtpComplete) {
			setOtpError('Please enter a 6-digit OTP code.')
			return
		}

		mutate(
			{ code: otp, email: newEmail },
			{
				onError: (e: unknown) => {
					const message = e instanceof Error ? e.message : 'Verification failed'
					setOtpError(message)
					toast.error(message)
				},
				onSuccess: async () => {
					setEmailError('')
					updateFormData({ email: newEmail })
					try {
						await onSubmit({ email: newEmail })
						toast.success('Email updated successfully')
						setOtpError('')
						goNext()
					} catch (e: unknown) {
						if (e instanceof Error) {
							const error = getErrorMessage(
								e.message,
								`Failed to update email, please try again.`,
							)
							toast.error(error)
							setEmailError(error)
						}
					}
				},
			},
		)
	}

	return (
		<div className="mx-auto flex w-full items-center justify-center md:max-w-2xl">
			<div className="w-full max-w-xl rounded-2xl border bg-white p-10 shadow-sm md:p-8">
				<div className="space-y-2 text-center">
					<TypographyH2 className="text-lg font-semibold">
						Enter new email
					</TypographyH2>
					<TypographyMuted>
						Send a one-time code to your new email and verify to complete the
						update.
					</TypographyMuted>
				</div>

				<div className="mt-6">
					<Input
						type="email"
						placeholder="you@example.com"
						value={newEmail}
						onChange={(e) => setNewEmail(e.target.value)}
						className="w-full"
					/>
				</div>
				{!isOtpSent ? (
					<div className="mt-4 flex justify-center">
						<Button
							disabled={isSendingOtp}
							onClick={handleSendOtp}
							variant="outline"
							size="sm"
						>
							{isSendingOtp ? <Spinner /> : null}
							Send OTP
						</Button>
					</div>
				) : null}

				{isOtpSent && (
					<>
						<div className="mt-7 flex justify-center">
							<InputOTP
								maxLength={6}
								pattern={REGEXP_ONLY_DIGITS}
								value={otp}
								onChange={(value: string) => setOtp(value)}
							>
								<InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:text-lg">
									<InputOTPSlot index={0} aria-invalid={!!otpError} />
									<InputOTPSlot index={1} aria-invalid={!!otpError} />
									<InputOTPSlot index={2} aria-invalid={!!otpError} />
									<InputOTPSlot index={3} aria-invalid={!!otpError} />
									<InputOTPSlot index={4} aria-invalid={!!otpError} />
									<InputOTPSlot index={5} aria-invalid={!!otpError} />
								</InputOTPGroup>
							</InputOTP>
						</div>

						<div className="mt-4 flex justify-center">
							<Button
								onClick={handleResend}
								disabled={!canResend || isSendingOtp}
								variant="ghost"
								size="sm"
							>
								{canResend ? 'Resend code' : `Resend in ${resendCountdown}s`}
							</Button>
						</div>
					</>
				)}

				{otpError && (
					<TypographySmall className="text-destructive mt-3">
						{otpError}
					</TypographySmall>
				)}
				{emailError && (
					<TypographySmall className="text-destructive mt-3">
						{emailError}
					</TypographySmall>
				)}

				<div className="mt-8 flex items-center justify-between">
					<Button type="button" variant="outline" onClick={goBack} size="lg">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back
					</Button>

					<Button
						type="button"
						variant="default"
						onClick={handleVerify}
						disabled={!isOtpSent || !isOtpComplete || isPending}
						size="lg"
					>
						{isPending ? <Spinner /> : null}
						Verify new email
						<ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
