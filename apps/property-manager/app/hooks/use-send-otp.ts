import { toast } from 'sonner'
import { useGetOtpCode } from '~/api/auth'
import { formatPhoneWithCountryCode } from '~/lib/misc'

type UseSendOtpOptions = {
	onSuccess?: () => void
	onError?: () => void
}

interface SendOtpProps {
	channel: 'EMAIL' | 'SMS'
	email?: string
	phone?: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const useSendOtp = (options?: UseSendOtpOptions) => {
	const { mutate, isPending } = useGetOtpCode()

	const sendOtp = ({ channel, email, phone }: SendOtpProps) => {
		// Handle SMS
		if (channel === 'SMS') {
			const formattedPhone = formatPhoneWithCountryCode(phone, '+233', 9)

			if (!formattedPhone) {
				toast.error('Invalid phone number')
				return
			}

			mutate(
				{ channel: ['SMS'], phone: formattedPhone },
				{
					onSuccess: () => {
						toast.success('OTP has been sent to your phone')
						options?.onSuccess?.()
					},
					onError: () => {
						toast.error('Failed to send OTP. Try again later.')
						options?.onError?.()
					},
				},
			)

			return
		}

		// Handle EMAIL
		if (channel === 'EMAIL') {
			if (!email) {
				toast.error('Email is required')
				return
			}
			if (!email || !emailRegex.test(email)) {
				toast.error('Invalid email address')
				return
			}
			mutate(
				{ channel: ['EMAIL'], email },
				{
					onSuccess: () => {
						toast.success('OTP has been sent to your email')
						options?.onSuccess?.()
					},
					onError: () => {
						toast.error('Failed to send OTP. Try again later.')
						options?.onError?.()
					},
				},
			)
		}
	}

	return { sendOtp, isSendingOtp: isPending }
}