import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useApplyContext } from './context'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import { FieldGroup } from '~/components/ui/field'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { ImageUpload } from '~/components/ui/image-upload'
import { Input } from '~/components/ui/input'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'

const ValidationSchema = z
	.object({
		type: z.enum(['INDIVIDUAL', 'COMPANY'], {
			error: 'Please select a type',
		}),
		name: z
			.string({ error: 'Name is required' })
			.min(2, 'Please enter a valid name'),
		description: z
			.string()
			.max(500, 'Description must be less than 500 characters')
			.optional(),
		registration_number: z.string().optional(),
		support_email: z.string().optional(),
		support_phone: z.string().optional(),
		website_url: z.url('Please enter a valid website URL').optional(),
		contact_name: z.string().min(2, 'Please enter a valid name').optional(),
		date_of_birth: z
			.date()
			.refine((date) => {
				const today = new Date()
				const age = today.getFullYear() - date.getFullYear()
				return age >= 18
			}, 'You must be at least 18 years old')
			.optional(),
		id_type: z
			.enum(['DRIVERS_LICENSE', 'PASSPORT', 'NATIONAL_ID'], {
				error: 'Please select an ID type',
			})
			.optional(),
		id_number: z.string().min(2, 'Please enter a valid ID number').optional(),
		id_expiry: z
			.date()
			.refine((date) => {
				const today = new Date()
				return date > today
			}, 'ID has expired')
			.optional(),
	})
	.superRefine((data, ctx) => {
		if (data.type === 'INDIVIDUAL') {
			if (!data.date_of_birth) {
				ctx.addIssue({
					code: 'custom',
					message: 'Please enter your date of birth',
					path: ['date_of_birth'],
				})
			}

			if (!data.id_type) {
				ctx.addIssue({
					code: 'custom',
					message: 'Please select an ID type',
					path: ['id_type'],
				})
			}

			if (!data.id_number) {
				ctx.addIssue({
					code: 'custom',
					message: 'Please enter your ID number',
					path: ['id_number'],
				})
			}

			if (!data.id_expiry) {
				ctx.addIssue({
					code: 'custom',
					message: 'Please enter your ID expiry date',
					path: ['id_expiry'],
				})
			}
		}
	})

export type FormSchema = z.infer<typeof ValidationSchema>

export function Step1() {
	const { goBack, goNext, formData, updateFormData } = useApplyContext()
	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			type: formData.type,
		},
	})

	const { upload, objectUrl } = useUploadObject('property-owners/logos')

	const { watch, handleSubmit, control, setValue } = rhfMethods
	const isIndividual = watch('type') === 'INDIVIDUAL'

	useEffect(() => {
		if (formData.name) {
			setValue('name', formData.name, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.description) {
			setValue('description', formData.description, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.registration_number) {
			setValue('registration_number', formData.registration_number, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.support_email) {
			setValue('support_email', formData.support_email, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.support_phone) {
			setValue('support_phone', formData.support_phone, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.website_url) {
			setValue('website_url', formData.website_url, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (!isIndividual && formData.contact_name) {
			setValue('contact_name', formData.contact_name, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.date_of_birth) {
			setValue('date_of_birth', new Date(formData.date_of_birth), {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.id_type) {
			setValue('id_type', formData.id_type, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.id_number) {
			setValue('id_number', formData.id_number, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.id_expiry) {
			setValue('id_expiry', new Date(formData.id_expiry), {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const onSubmit = async (data: FormSchema) => {
		updateFormData({
			name: data.name,
			description: data.description,
			registration_number: data.registration_number,
			support_email: data.support_email,
			support_phone: data.support_phone,
			website_url: data.website_url,
			contact_name: isIndividual ? data.name : data.contact_name,
			date_of_birth: data.date_of_birth?.toISOString(),
			id_type: data.id_type,
			id_number: data.id_number,
			id_expiry: data.id_expiry?.toISOString(),
		})
		goNext()
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto mb-5 space-y-5 md:max-w-2/3"
			>
				<div className="space-y-2">
					<TypographyH2 className="">
						{isIndividual ? 'Basic' : 'Company'} Information
					</TypographyH2>
					<TypographyMuted className="">
						{isIndividual
							? 'Please provide your personal information as an individual property owner.'
							: "Please provide your company's information to proceed with the application."}
					</TypographyMuted>
				</div>

				<FieldGroup>
					<FormField
						name="name"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input type="text" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{isIndividual ? (
						<>
							<FormField
								name="date_of_birth"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Date of birth</FormLabel>
										<FormControl>
											<DatePickerInput
												value={field.value}
												onChange={field.onChange}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								name="id_type"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>ID Type</FormLabel>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												value={field.value}
												defaultValue={field.value}
											>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														<SelectLabel>All Types</SelectLabel>
														<SelectItem value="NATIONAL_ID">
															National ID
														</SelectItem>
														<SelectItem value="PASSPORT">Passport</SelectItem>
														<SelectItem value="DRIVERS_LICENSE">
															Driver's License
														</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<FormField
									name="id_number"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>ID Number</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="id_expiry"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>ID Expiry</FormLabel>
											<FormControl>
												<DatePickerInput
													value={field.value}
													onChange={field.onChange}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</FieldGroup>
						</>
					) : (
						<>
							<FormField
								name="description"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>About</FormLabel>
										<FormControl>
											<Textarea
												placeholder="About the company..."
												rows={5}
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Any details you want to share about the company?
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<ImageUpload
								shape="circle"
								hint="Optional"
								acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
								// disabled={values.usePrimaryLogo}
								// error={errors.logo && touched.logo ? ' ' : undefined}
								fileCallback={upload}
								imageSrc={safeString(objectUrl)}
								// inputContainerClassName='bg-white dark:bg-canvas-dark'
								label="Logo"
								name="logo"
								validation={{
									maxByteSize: 2048000, // 2MB
								}}
							/>

							<FormField
								name="registration_number"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Registration Number</FormLabel>
										<FormControl>
											<Input {...field} type="text" />
										</FormControl>
										<FormDescription>Optional</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<FormField
									name="support_email"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Support Email</FormLabel>
											<FormControl>
												<Input {...field} type="text" />
											</FormControl>
											<FormDescription>Optional</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="support_phone"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Support Phone</FormLabel>
											<FormControl>
												<Input {...field} type="text" />
											</FormControl>
											<FormDescription>Optional</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</FieldGroup>
						</>
					)}
				</FieldGroup>

				<div className="mt-10 flex items-center justify-end space-x-5">
					<Button onClick={goBack} type="button" size="sm" variant="ghost">
						<ArrowLeft />
						Go Back
					</Button>
					<Button
						size="lg"
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						Next
					</Button>
				</div>
			</form>
		</Form>
	)
}
