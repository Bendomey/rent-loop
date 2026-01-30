import { zodResolver } from '@hookform/resolvers/zod'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { useTenantApplicationContext } from './context'
import { Button } from '~/components/ui/button'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '~/components/ui/input-otp'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'

const ValidationSchema = z.object({
	phone: z
		.string({ error: 'Phone number is required' })
		.min(9, 'Please enter a valid phone number'),
	otp: z
		.string({ error: 'OTP is required' })
		.length(4, 'Please enter a valid 4-digit OTP'),
})

type FormSchema = z.infer<typeof ValidationSchema>

const isSubmitting = false
const error = null

export function TenantApplicationOTPValidationModule({
	referredBy,
	unitId,
}: {
	referredBy: string | null
	unitId: string | null
}) {
	const navigate = useNavigate()
	const [otp, setOtp] = useState('')
	const [canResend, setCanResend] = useState(true)
	const [resendCountdown, setResendCountdown] = useState(0)

	const { goBack, goNext, formData, unblockNavigation } =
		useTenantApplicationContext()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})

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
		if (!canResend) return
		setCanResend(false)
		setResendCountdown(30)
	}

	useEffect(() => {
		if (otp.length === 4) {
			verify()
		}
	}, [otp])

	const verify = () => {
		//    ToDO: verify OTP logic (Mutate to backend)
		if (otp !== '1234') {
			// Clear form data and set bypass flag to allow navigation without prompting
			unblockNavigation()
			// Small delay to ensure state updates before navigation
			setTimeout(() => {
				void navigate(
					`/tenants/apply/new?unit=${unitId}&referred_by=${referredBy}`,
				)
			}, 0)
		} else {
			goNext()
		}
	}

	return (
		<div className="mx-auto flex w-full items-center justify-center md:max-w-2xl">
			<div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-sm md:p-8">
				{/* Header */}
				<div className="space-y-2 text-center">
					<TypographyH2 className="text-lg font-semibold">
						Verify your phone number
					</TypographyH2>
					<TypographyMuted className="leading-relaxed">
						Enter the 4-digit code sent to{' '}
						<span className="font-medium text-zinc-900">
							{formData?.phone || 'your phone'}
						</span>
					</TypographyMuted>
				</div>

				{/* OTP Input */}
				<div className="mt-8 flex justify-center">
					<InputOTP
						maxLength={4}
						pattern={REGEXP_ONLY_DIGITS}
						value={otp}
						onChange={(v: any) => setOtp(v)}
					>
						<InputOTPGroup className="*:data-[slot=input-otp-slot]:h-14 *:data-[slot=input-otp-slot]:w-18 *:data-[slot=input-otp-slot]:text-xl">
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
							<InputOTPSlot index={3} />
						</InputOTPGroup>
					</InputOTP>
				</div>
				{error && (
					<TypographySmall className="text-destructive mt-4 text-center">
						{error}
					</TypographySmall>
				)}

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
						onClick={verify}
						disabled={otp.length < 4 || isSubmitting}
						className="w-full bg-rose-600 hover:bg-rose-700 md:w-auto"
					>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Verify code
						<ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
