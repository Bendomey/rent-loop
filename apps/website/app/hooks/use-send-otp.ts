import { toast } from 'sonner'
import { useGetOtpCode } from '~/api/auth'
import { normalizeInternationalPhoneNumber } from '~/lib/phone'

type UseSendOtpOptions = {
	onSuccess?: () => void
	onError?: () => void
}

type OtpChannel = 'EMAIL' | 'SMS'

interface SendOtpProps {
	channel: OtpChannel | OtpChannel[]
	email?: string
	phone?: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const useSendOtp = (options?: UseSendOtpOptions) => {
	const { mutate, isPending } = useGetOtpCode()

	const sendOtp = ({ channel, email, phone }: SendOtpProps) => {
		const requested = Array.isArray(channel) ? channel : [channel]

		const trimmedEmail = email?.trim()
		const trimmedPhone = phone?.trim()

		let formattedPhone: string | undefined
		const channels: OtpChannel[] = []

		if (requested.includes('SMS') && trimmedPhone) {
			formattedPhone =
				normalizeInternationalPhoneNumber(trimmedPhone) ?? undefined
			if (formattedPhone) {
				channels.push('SMS')
			}
		}

		if (
			requested.includes('EMAIL') &&
			trimmedEmail &&
			emailRegex.test(trimmedEmail)
		) {
			channels.push('EMAIL')
		}

		if (channels.length === 0) {
			toast.error('Enter a valid phone number or email to continue')
			return
		}

		const wantsSms = channels.includes('SMS')
		const wantsEmail = channels.includes('EMAIL')

		mutate(
			{
				channel: channels,
				...(wantsEmail ? { email: trimmedEmail } : {}),
				...(wantsSms ? { phone: formattedPhone } : {}),
			},
			{
				onSuccess: () => {
					const destination =
						wantsSms && wantsEmail
							? 'your email and phone'
							: wantsSms
								? 'your phone'
								: 'your email'
					toast.success(`OTP has been sent to ${destination}`)
					options?.onSuccess?.()
				},
				onError: () => {
					toast.error('Failed to send OTP. Try again later.')
					options?.onError?.()
				},
			},
		)
	}

	return { sendOtp, isSendingOtp: isPending }
}
