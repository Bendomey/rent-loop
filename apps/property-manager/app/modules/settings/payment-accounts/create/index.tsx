import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCreatePaymentAccount } from '~/api/payment-accounts'
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
import { Textarea } from '~/components/ui/textarea'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { cn } from '~/lib/utils'

const ValidationSchema = z
	.object({
		rail: z.enum(['MOMO', 'BANK_TRANSFER', 'OFFLINE'], {
			error: 'Please select an account type',
		}),
		provider: z
			.enum(['MTN', 'VODAFONE', 'AIRTELTIGO', 'BANK_API', 'CASH'])
			.optional(),
		identifier: z.string().optional(),
		is_default: z.boolean(),
		status: z.enum(['ACTIVE', 'INACTIVE'], { error: 'Please select a status' }),
		// Metadata fields — collected flat and merged into metadata on submit
		account_name: z.string().optional(),
		bank_name: z.string().optional(),
		branch: z.string().optional(),
		description: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.rail === 'MOMO') {
			if (!data.provider) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Please select a provider',
					path: ['provider'],
				})
			}
			if (!data.identifier) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Phone number is required',
					path: ['identifier'],
				})
			}
		}
		if (data.rail === 'BANK_TRANSFER') {
			if (!data.identifier) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Account number is required',
					path: ['identifier'],
				})
			}
			if (!data.account_name) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Account name is required',
					path: ['account_name'],
				})
			}
			if (!data.bank_name) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Bank name is required',
					path: ['bank_name'],
				})
			}
		}
	})

type FormSchema = z.infer<typeof ValidationSchema>

const momoProviders: Array<{
	label: string
	value: FormSchema['provider']
}> = [
	{ label: 'MTN MoMo', value: 'MTN' },
	{ label: 'Vodafone Cash', value: 'VODAFONE' },
	{ label: 'AirtelTigo Money', value: 'AIRTELTIGO' },
]

const railOptions: Array<{ label: string; value: FormSchema['rail'] }> = [
	{ label: 'Mobile Money (MoMo)', value: 'MOMO' },
	{ label: 'Bank Transfer', value: 'BANK_TRANSFER' },
	{ label: 'Cash / Offline', value: 'OFFLINE' },
]

const statusOptions: Array<{ label: string; value: FormSchema['status'] }> = [
	{ label: 'Active', value: 'ACTIVE' },
	{ label: 'Inactive', value: 'INACTIVE' },
]

export function CreatePaymentAccountModule() {
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	const { mutate, isPending } = useCreatePaymentAccount()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			rail: 'MOMO',
			provider: 'MTN',
			identifier: '',
			is_default: false,
			status: 'ACTIVE',
			account_name: '',
			bank_name: '',
			branch: '',
			description: '',
		},
	})

	const { watch, setValue, formState } = rhfMethods
	const rail = watch('rail')

	// Auto-set provider when rail changes
	useEffect(() => {
		if (rail === 'BANK_TRANSFER') {
			setValue('provider', 'BANK_API')
		} else if (rail === 'OFFLINE') {
			setValue('provider', 'CASH')
		} else if (rail === 'MOMO') {
			setValue('provider', 'MTN')
		}
	}, [rail, setValue])

	const onSubmit = (formData: FormSchema) => {
		const metadata: PaymentAccountMetadata = {}

		if (formData.rail === 'MOMO' && formData.account_name) {
			metadata.account_name = formData.account_name
		}
		if (formData.rail === 'BANK_TRANSFER') {
			if (formData.account_name) metadata.account_name = formData.account_name
			if (formData.bank_name) metadata.bank_name = formData.bank_name
			if (formData.branch) metadata.branch = formData.branch
		}
		if (formData.rail === 'OFFLINE' && formData.description) {
			metadata.description = formData.description
		}

		mutate(
			{
				rail: formData.rail,
				provider: formData.provider,
				identifier: formData.identifier || undefined,
				metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
				is_default: formData.is_default,
				status: formData.status,
			},
			{
				onError: () =>
					toast.error('Failed to create payment account. Try again later.'),
				onSuccess: () => {
					toast.success('Payment account has been successfully created')
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

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={rhfMethods.handleSubmit(onSubmit)}
				className="mx-6 my-6 space-y-8 md:mx-auto md:max-w-2/3"
			>
				<div className="space-y-2">
					<TypographyH2>Add Payment Account</TypographyH2>
					<TypographyMuted>
						Add a payment account so tenants know where to send offline
						payments. You can add MoMo numbers, bank accounts, or cash
						collection instructions.
					</TypographyMuted>
				</div>

				<FieldGroup>
					{/* Rail */}
					<FormField
						name="rail"
						control={rhfMethods.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Account Type <span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select account type" />
										</SelectTrigger>
										<SelectContent>
											{railOptions.map((item) => (
												<SelectItem key={item.value} value={item.value!}>
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

					{/* Provider — only shown for MOMO */}
					{rail === 'MOMO' && (
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
												{momoProviders.map((item) => (
													<SelectItem key={item.value} value={item.value!}>
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
					)}

					{/* Identifier */}
					{rail !== 'OFFLINE' && (
						<FormField
							name="identifier"
							control={rhfMethods.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{rail === 'MOMO' ? 'Phone Number' : 'Account Number'}
										<span className="text-red-500"> *</span>
									</FormLabel>
									<FormControl>
										<Input
											type="text"
											placeholder={
												rail === 'MOMO' ? '0241234567' : 'e.g. 1234567890'
											}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					{/* Account Name — MOMO and BANK_TRANSFER */}
					{(rail === 'MOMO' || rail === 'BANK_TRANSFER') && (
						<FormField
							name="account_name"
							control={rhfMethods.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Account Name
										{rail === 'BANK_TRANSFER' && (
											<span className="text-red-500"> *</span>
										)}
									</FormLabel>
									<FormControl>
										<Input type="text" placeholder="e.g. John Doe" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					{/* Bank Name — BANK_TRANSFER only */}
					{rail === 'BANK_TRANSFER' && (
						<>
							<FormField
								name="bank_name"
								control={rhfMethods.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Bank Name <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												type="text"
												placeholder="e.g. GCB Bank"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								name="branch"
								control={rhfMethods.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Branch</FormLabel>
										<FormControl>
											<Input
												type="text"
												placeholder="e.g. Accra Main Branch"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</>
					)}

					{/* Description — OFFLINE only */}
					{rail === 'OFFLINE' && (
						<FormField
							name="description"
							control={rhfMethods.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Payment Instructions</FormLabel>
									<FormControl>
										<Textarea
											placeholder="e.g. Visit the office at 123 Main Street between 9am–5pm to pay in cash."
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					{/* Is Default */}
					<div className="flex flex-col items-start gap-2">
						<FormLabel>Set as Default</FormLabel>
						<div className="flex space-x-3">
							{[
								{ label: 'Yes', value: true },
								{ label: 'No', value: false },
							].map((option) => {
								const isSelected = watch('is_default') === option.value
								return (
									<Button
										type="button"
										key={String(option.value)}
										variant={isSelected ? 'default' : 'outline'}
										className={cn({ 'bg-rose-600 text-white': isSelected })}
										onClick={() =>
											setValue('is_default', option.value, {
												shouldDirty: true,
											})
										}
									>
										{option.label}
									</Button>
								)
							})}
						</div>
					</div>

					{/* Status */}
					<div className="flex flex-col items-start gap-2">
						<FormLabel>Status</FormLabel>
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
							<TypographySmall className="text-destructive mt-1">
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
						disabled={isPending}
						size="lg"
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						{isPending && <Spinner />} Add Account
					</Button>
				</div>
			</form>
		</Form>
	)
}
