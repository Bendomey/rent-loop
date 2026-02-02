import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon, ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useTenantApplicationContext } from '../context'
import { useGetOtpCode } from '~/api/auth'
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
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH2 } from '~/components/ui/typography'

const ValidationSchema = z.object({
	phone: z
		.string({ error: 'Phone number is required' })
		.min(9, 'Please enter a valid phone number'),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function Step1() {
	const { goNext, goBack, formData, updateFormData } =
		useTenantApplicationContext()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {},
	})

	const { handleSubmit, control, setValue } = rhfMethods

	useEffect(() => {
		if (formData.phone) {
			setValue('phone', formData.phone, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
	}, [formData])

	const { mutate, isPending } = useGetOtpCode()

	const onSubmit = async (data: FormSchema) => {
		updateFormData({ phone: data.phone })

		if (data) {
			mutate(
				{
					channel: 'sms',
					phone: `+233${data.phone.slice(-9)}`,
				},
				{
					onError: () => {
						toast.error(`Failed to send phone. Try again later.`)
					},
					onSuccess: () => {
						toast.success(`OTP has been sent to your phone`)
						goNext()
					},
				},
			)
		}
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
						</div>

						<FormField
							name="phone"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Phone number <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input {...field} type="text" placeholder="201234567" />
									</FormControl>
									<FormDescription>
										We may send a verification code to confirm it’s you. Please
										use a phone number you can access.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="mt-10 flex flex-col-reverse gap-3 border-t pt-6 md:flex-row md:justify-between">
							<Button
								disabled={isPending}
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
								disabled={isPending}
								size="lg"
								variant="default"
								className="w-full bg-rose-600 hover:bg-rose-700 md:w-auto"
							>
								{isPending ? <Spinner /> : null} Next{' '}
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</form>
		</Form>
	)
}
