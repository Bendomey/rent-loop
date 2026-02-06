import { toast } from 'sonner'
import { useGetOtpCode } from '~/api/auth'
import { formatPhoneWithCountryCode } from '~/lib/misc'

type UseSendOtpOptions = {
	onSuccess?: () => void
	onError?: () => void
}

export const useSendOtp = (options?: UseSendOtpOptions) => {
	const { mutate, isPending } = useGetOtpCode()

	const sendOtp = (phone?: string) => {
		const formattedPhone = formatPhoneWithCountryCode(phone, '+233', 9)

		if (!formattedPhone) {
			toast.error('Invalid phone number')
			return
		}

		mutate(
			{ channel: 'sms', phone: formattedPhone },
			{
				onSuccess: () => {
					toast.success(`OTP has been sent to your phone`)
					options?.onSuccess?.()
				},
				onError: () => {
					toast.error(`Failed to send OTP. Try again later.`)
					options?.onError?.()
				},
			},
		)
	}

	return { sendOtp, isSendingOtp: isPending }
}
