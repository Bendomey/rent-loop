import { toast } from 'sonner'
import { useGetOtpCode } from '~/api/auth'
import { formatPhoneWithCountryCode } from '~/lib/misc'
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
		const channels = Array.isArray(channel) ? channel : [channel]
		const wantsSms = channels.includes('SMS')
		const wantsEmail = channels.includes('EMAIL')

		let formattedPhone: string | undefined
		if (wantsSms) {
			formattedPhone = normalizeInternationalPhoneNumber(phone) ?? undefined
			if (!formattedPhone) {
				toast.error('Invalid phone number')
				return
			}
		}

		if (wantsEmail) {
			if (!email) {
				toast.error('Email is required')
				return
			}
			if (!emailRegex.test(email)) {
				toast.error('Invalid email address')
				return
			}
		}

		mutate(
			{
				channel: channels,
				...(wantsEmail ? { email } : {}),
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
