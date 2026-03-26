import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useUpdateClientEmailContext } from '../context'
import { useVerifyOtpCode } from '~/api/auth'
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
import { safeString } from '~/lib/strings'

export function Step0() {
	const { goNext, formData, closeModal } = useUpdateClientEmailContext()
	const [otp, setOtp] = useState('')
	const [otpError, setOtpError] = useState('')
	const [resendCountdown, setResendCountdown] = useState(60)
	const [resendAttempts, setResendAttempts] = useState(0)
	const [isVerified, setIsVerified] = useState(false)

	const currentEmail = safeString(formData.email)
	const { sendOtp, isSendingOtp } = useSendOtp()
	const { mutate, isPending } = useVerifyOtpCode()

	const isOtpComplete = otp.length === 6
	const canResend = resendCountdown === 0

	useEffect(() => {
		if (resendCountdown <= 0) return
		const handle = window.setTimeout(
			() => setResendCountdown((s) => s - 1),
			1000,
		)
		return () => window.clearTimeout(handle)
	}, [resendCountdown])

	const handleResend = () => {
		if (!canResend) return
		setResendAttempts((p) => p + 1)
		setResendCountdown(Math.min(30 * 2 ** resendAttempts, 300))
		sendOtp({ channel: 'EMAIL', email: currentEmail })
	}

	useEffect(() => {
		if (isOtpComplete) {
			void handleVerify()
		}
		setOtpError('')
	}, [isOtpComplete])

	const handleVerify = () => {
		if (!currentEmail) {
			setOtpError('No current email available to verify')
			return
		}
		if (!isOtpComplete) {
			setOtpError('Please enter a 6-digit OTP code.')
			return
		}

		mutate(
			{ code: otp, email: currentEmail },
			{
				onError: (e: unknown) => {
					const message =
						e instanceof Error ? e.message : 'Failed to verify OTP.'
					setOtpError(message)
					toast.error(message)
				},
				onSuccess: () => {
					setIsVerified(true)
					toast.success('Current email has been verified successfully.')
					goNext()
				},
			},
		)
	}

	return (
		<div className="mx-auto flex w-full items-center justify-center md:max-w-2xl">
			<div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm md:p-8 dark:border-zinc-700 dark:bg-zinc-900">
				<div className="space-y-2 text-center">
					<TypographyH2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
						Verify current email
					</TypographyH2>
					<TypographyMuted className="dark:text-zinc-400">
						Enter the 6-digit verification code sent to{' '}
						<span className="font-medium text-zinc-900 dark:text-zinc-50">
							{currentEmail || 'your registered email'}
						</span>
					</TypographyMuted>
				</div>

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

				{otpError && (
					<TypographySmall className="text-destructive mt-3">
						{otpError}
					</TypographySmall>
				)}

				<div className="mt-6 flex justify-center">
					<Button
						onClick={handleResend}
						type="button"
						variant="ghost"
						size="sm"
						disabled={!canResend || isSendingOtp}
						className="text-rose-600 hover:bg-transparent disabled:opacity-50"
					>
						{isSendingOtp ? <Spinner /> : null}
						{canResend ? 'Resend code' : `Resend in ${resendCountdown}s`}
					</Button>
				</div>

				<div className="mt-8 flex items-center justify-between">
					<Button
						type="button"
						variant="outline"
						onClick={closeModal}
						size="lg"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back
					</Button>
					<Button
						type="button"
						variant="default"
						onClick={handleVerify}
						disabled={!isOtpComplete || isPending}
						size="lg"
					>
						{isPending ? <Spinner /> : null}
						Verify code
						<ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
