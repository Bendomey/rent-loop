import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useLoaderData } from 'react-router'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUpdatePaymentAccount } from '~/api/payment-accounts'
import { Button } from '~/components/ui/button'
import { FieldGroup } from '~/components/ui/field'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import type { loader } from '~/routes/_auth._dashboard.settings.payment-accounts.$paymentAccountId.edit'

const ValidationSchema = z.object({
	identifier: z.string().optional(),
	provider: z.enum(['MTN', 'VODAFONE', 'AIRTELTIGO', 'PAYSTACK', 'BANK_API'], {
		error: 'Please select a provider',
	}),
	status: z.enum(['ACTIVE', 'INACTIVE'], { error: 'Please select a status' }),
})

type FormSchema = z.infer<typeof ValidationSchema>

const providerOptions: Array<{ label: string; value: FormSchema['provider'] }> =
	[
		{ label: 'MTN', value: 'MTN' },
		{ label: 'Vodafone', value: 'VODAFONE' },
		{ label: 'AirTelTigo', value: 'AIRTELTIGO' },
		{ label: 'Paystack', value: 'PAYSTACK' },
		{ label: 'Bank', value: 'BANK_API' },
	]

const statusOptions: Array<{ label: string; value: FormSchema['status'] }> = [
	{ label: 'Active', value: 'ACTIVE' },
	{ label: 'Inactive', value: 'INACTIVE' },
]

export function EditPaymentAccountModule() {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { paymentAccount: data } = useLoaderData<typeof loader>()

	const { mutate, isPending } = useUpdatePaymentAccount()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			identifier: '',
			provider: 'MTN',
			status: 'ACTIVE',
		},
	})

	// Reset form when data loads
	useEffect(() => {
		if (data) {
			rhfMethods.reset({
				identifier: safeString(data.identifier),
				provider: data.provider ?? 'MTN',
				status: data.status ?? 'ACTIVE',
			})
		}
	}, [data, rhfMethods])

	const onSubmit = async (formData: FormSchema) => {
		mutate(
			{
				id: safeString(data?.id),
				identifier: formState.dirtyFields.identifier
					? formData.identifier
					: undefined,
				status: formState.dirtyFields.status ? formData.status : undefined,
				provider: formState.dirtyFields.provider
					? formData.provider
					: undefined,
			},
			{
				onError: () =>
					toast.error('Failed to update payment account. Try again later.'),
				onSuccess: () => {
					toast.success('Payment account has been successfully updated')
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.PAYMENT_ACCOUNTS],
					})
					setTimeout(() => {
						void navigate(`/settings/payment-accounts`)
					}, 500)
				},
			},
		)
	}

	const { watch, formState, setValue } = rhfMethods

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={rhfMethods.handleSubmit(onSubmit)}
				className="mx-6 my-6 space-y-8 md:mx-auto md:max-w-2/3"
			>
				<div className="space-y-2">
					<TypographyH2>
						Edit {data?.identifier ? data.identifier : 'Payment Account'}
					</TypographyH2>
					<TypographyMuted>
						Use the form below to edit this payment account. Make sure to save
						your changes when you're done.
					</TypographyMuted>
					<TypographyMuted>
						Note: Changing the provider or status may affect how this payment
						account is used in transactions.
					</TypographyMuted>
				</div>

				<FieldGroup>
					<FormField
						name="identifier"
						control={rhfMethods.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Identifier</FormLabel>
								<FormControl>
									<Input type="text" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						name="provider"
						control={rhfMethods.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Provider <span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select provider" />
										</SelectTrigger>
										<SelectContent>
											{providerOptions.map((item) => (
												<SelectItem key={item.value} value={item.value}>
													{item.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex flex-col items-center space-x-6 md:flex-row">
						<FormLabel>Status: </FormLabel>
						<div className="flex space-x-3">
							{statusOptions.map((option) => {
								const isSelected = watch('status') === option.value
								return (
									<Button
										type="button"
										onClick={() =>
											setValue('status', option.value, {
												shouldDirty: true,
												shouldValidate: true,
											})
										}
										key={option.value}
										variant={isSelected ? 'default' : 'outline'}
										className={cn({ 'bg-rose-600 text-white': isSelected })}
									>
										{option.label}
									</Button>
								)
							})}
						</div>
						{formState.errors?.status && (
							<TypographySmall className="text-destructive mt-3">
								{formState.errors.status.message}
							</TypographySmall>
						)}
					</div>
				</FieldGroup>

				<div className="mt-12 flex items-center justify-between space-x-5">
					<Link to="/settings/payment-accounts">
						<Button
							type="button"
							size="lg"
							variant="outline"
							disabled={isPending}
						>
							<ArrowLeft /> Cancel
						</Button>
					</Link>
					<Button
						disabled={isPending || !formState.isDirty}
						size="lg"
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						{isPending && <Spinner />} Update
					</Button>
				</div>
			</form>
		</Form>
	)
}
