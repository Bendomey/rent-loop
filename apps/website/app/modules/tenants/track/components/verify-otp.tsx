import { ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useSendTrackingOtp, useVerifyTrackingOtp } from '~/api/tracking'
import { Button } from '~/components/ui/button'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '~/components/ui/input-otp'
import { Spinner } from '~/components/ui/spinner'
import { APP_NAME } from '~/lib/constants'

interface Props {
	code: string
	onVerified: (accessToken: string, application: TrackingApplication) => void
}

export function VerifyOtp({ code, onVerified }: Props) {
	const [maskedPhone, setMaskedPhone] = useState<string | null>(null)
	const [otpValue, setOtpValue] = useState('')
	const [cooldown, setCooldown] = useState(0)
	const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const sendOtp = useSendTrackingOtp()
	const verifyOtp = useVerifyTrackingOtp()

	const startCooldown = useCallback(() => {
		setCooldown(60)
		cooldownRef.current = setInterval(() => {
			setCooldown((prev) => {
				if (prev <= 1) {
					if (cooldownRef.current) clearInterval(cooldownRef.current)
					return 0
				}
				return prev - 1
			})
		}, 1000)
	}, [])

	useEffect(() => {
		return () => {
			if (cooldownRef.current) clearInterval(cooldownRef.current)
		}
	}, [])

	const handleSendCode = () => {
		sendOtp.mutate(code, {
			onSuccess: (data) => {
				if (data) {
					setMaskedPhone(data.masked_phone)
					startCooldown()
					toast.success('Verification code sent')
				}
			},
			onError: (error) => {
				toast.error(
					error instanceof Error
						? error.message
						: 'Failed to send verification code',
				)
			},
		})
	}

	const handleVerify = (value: string) => {
		verifyOtp.mutate(
			{ code, otpCode: value },
			{
				onSuccess: (data) => {
					if (data) {
						onVerified(data.access_token, data.application)
					}
				},
				onError: (error) => {
					toast.error(
						error instanceof Error
							? error.message
							: 'Invalid verification code',
					)
					setOtpValue('')
				},
			},
		)
	}

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center px-4">
			<div className="mx-auto w-full max-w-md space-y-6 text-center">
				{/* Branding */}
				<div className="flex justify-center">
					<div className="flex flex-row items-end">
						<span className="text-4xl font-extrabold text-rose-700">
							{APP_NAME.slice(0, 4)}
						</span>
						<span className="text-4xl font-extrabold">{APP_NAME.slice(4)}</span>
					</div>
				</div>

				{/* Icon */}
				<div className="flex justify-center">
					<div className="rounded-full bg-rose-50 p-4">
						<ShieldCheck className="h-10 w-10 text-rose-600" />
					</div>
				</div>

				{!maskedPhone ? (
					<>
						{/* State A: Send code */}
						<div className="space-y-2">
							<h1 className="text-2xl font-bold text-slate-900">
								Verify your identity
							</h1>
							<p className="text-sm text-slate-600">
								We&apos;ll send a verification code to the phone number
								associated with application{' '}
								<span className="font-semibold text-slate-900">{code}</span>
							</p>
						</div>

						<Button
							onClick={handleSendCode}
							disabled={sendOtp.isPending}
							className="w-full bg-rose-600 hover:bg-rose-500"
							size="lg"
						>
							{sendOtp.isPending ? (
								<>
									<Spinner className="mr-2" />
									Sending...
								</>
							) : (
								'Send Verification Code'
							)}
						</Button>
					</>
				) : (
					<>
						{/* State B: Enter OTP */}
						<div className="space-y-2">
							<h1 className="text-2xl font-bold text-slate-900">
								Enter verification code
							</h1>
							<p className="text-sm text-slate-600">
								We sent a 6-digit code to{' '}
								<span className="font-semibold text-slate-900">
									{maskedPhone}
								</span>
							</p>
						</div>

						<div className="flex justify-center">
							<InputOTP
								maxLength={6}
								value={otpValue}
								onChange={setOtpValue}
								onComplete={handleVerify}
								disabled={verifyOtp.isPending}
							>
								<InputOTPGroup>
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
									<InputOTPSlot index={3} />
									<InputOTPSlot index={4} />
									<InputOTPSlot index={5} />
								</InputOTPGroup>
							</InputOTP>
						</div>

						{verifyOtp.isPending && (
							<div className="flex items-center justify-center gap-2 text-sm text-slate-500">
								<Spinner />
								Verifying...
							</div>
						)}

						<div className="text-sm text-slate-500">
							{cooldown > 0 ? (
								<span>Resend code in {cooldown}s</span>
							) : (
								<button
									type="button"
									onClick={handleSendCode}
									disabled={sendOtp.isPending}
									className="font-medium text-rose-600 hover:text-rose-500"
								>
									Resend Code
								</button>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	)
}
