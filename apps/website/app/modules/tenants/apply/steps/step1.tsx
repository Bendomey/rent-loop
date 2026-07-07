import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon, ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { z } from 'zod'
import { useTenantApplicationContext } from '../context'
import { InternationalPhoneInput } from '~/components/international-phone'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH2 } from '~/components/ui/typography'
import { useSendOtp } from '~/hooks/use-send-otp'
import { Input } from '~/components/ui/input'
import { safeString } from '~/lib/strings'
import { normalizeInternationalPhoneNumber } from '~/lib/phone'

const ValidationSchema = z.object({
	phone: z
		.string({ error: 'Phone number is required' })
		.refine(isValidPhoneNumber, {
			message: 'Please enter a valid phone number',
		}),
	email: z
		.string()
		.email('Please enter a valid email address')
		.optional()
		.or(z.literal('')),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function Step1() {
	const { goNext, goBack, formData, updateFormData } =
		useTenantApplicationContext()

	const [otpError, setOtpError] = useState(false)

	const { sendOtp, isSendingOtp } = useSendOtp({
		onSuccess: goNext,
		onError: () => setOtpError(true),
	})

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: { email: '' },
	})

	const { handleSubmit, control, setValue } = rhfMethods

	useEffect(() => {
		if (formData.phone) {
			setValue('phone', formData.phone, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.email) {
			setValue('email', formData.email, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
	}, [formData])

	const onSubmit = async (data: FormSchema) => {
		setOtpError(false)
		const normalizedPhone = normalizeInternationalPhoneNumber(data.phone)
		const trimmedEmail = data.email?.trim()

		updateFormData({ phone: data.phone, email: safeString(trimmedEmail) })

		const channel: Array<'EMAIL' | 'SMS'> = trimmedEmail
			? ['EMAIL', 'SMS']
			: ['SMS']

		sendOtp({
			channel,
			phone: normalizedPhone,
			...(trimmedEmail ? { email: trimmedEmail } : {}),
		})
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto my-4 flex w-full items-center justify-center space-y-6 px-4 md:my-8 md:max-w-2xl"
			>
				<div className="w-full max-w-xl rounded-xl border shadow-sm">
					{/* Content */}
					<div className="space-y-8 px-6 py-8">
						<div className="space-y-4">
							<TypographyH2 className="text-lg font-semibold">
								Let’s get you started
							</TypographyH2>

							<Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
								<AlertCircleIcon />
								<AlertTitle>Continue your application</AlertTitle>
								<AlertDescription>
									Enter your phone number to get started. If you’ve applied
									before, we’ll find your details and resume your application.
									New applicants will be guided through a fresh application.
								</AlertDescription>
							</Alert>

							{otpError && (
								<Alert variant="destructive">
									<AlertCircleIcon />
									<AlertTitle>Something went wrong</AlertTitle>
									<AlertDescription>
										We couldn’t send your OTP. Please try again.
									</AlertDescription>
								</Alert>
							)}
						</div>

						<FormField
							name="phone"
							control={control}
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel>
										Phone number <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<InternationalPhoneInput
											value={field.value}
											onChange={field.onChange}
											error={!!fieldState.error}
										/>
									</FormControl>
									<FormDescription>
										We may send a verification code to confirm it's you. Enter
										your number in international format, e.g.{' '}
										<span className="font-medium">+233 201 234 567</span>.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="email"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input {...field} type="text" />
									</FormControl>
									<FormDescription>
										We'll send notifications to this email
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="mt-10 flex flex-col-reverse gap-3 border-t pt-6 md:flex-row md:justify-between">
							<Button
								disabled={isSendingOtp}
								onClick={goBack}
								type="button"
								size="lg"
								variant="outline"
								className="w-full md:w-auto"
							>
								<ArrowLeft className="mr-2 h-4 w-4" />
								Go Back
							</Button>
							<Button
								disabled={isSendingOtp}
								size="lg"
								variant="default"
								className="w-full bg-rose-600 hover:bg-rose-700 md:w-auto"
							>
								{isSendingOtp ? <Spinner /> : null} Next{' '}
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</form>
		</Form>
	)
}
