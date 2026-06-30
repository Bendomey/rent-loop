import { toast } from 'sonner'
import { useGetOtpCode } from '~/api/auth'
import { normalizeInternationalPhoneNumber } from '~/lib/phone'

type UseSendOtpOptions = {
	onSuccess?: () => void
	onError?: () => void
}

export const useSendOtp = (options?: UseSendOtpOptions) => {
	const { mutate, isPending } = useGetOtpCode()

	const sendOtp = (phone?: string) => {
		const formattedPhone = normalizeInternationalPhoneNumber(phone)

		if (!formattedPhone) {
			toast.error('Invalid phone number')
			return
		}

		mutate(
			{ channel: ['SMS'], phone: formattedPhone },
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
