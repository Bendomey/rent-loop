import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreatePropertyTenantApplicationContext } from '../context'
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
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'

const ValidationSchema = z.object({
	on_boarding_method: z.enum(['SELF', 'ADMIN'], {
		error: 'Please select an onboarding method',
	}),
	first_name: z
		.string({ error: 'First Name is required' })
		.min(2, 'Please enter a valid name'),
	other_names: z.string().optional(),
	last_name: z
		.string({ error: 'Last Name is required' })
		.min(2, 'Please enter a valid name'),
	email: z.email('Please enter a valid email address'),
	phone: z
		.string({ error: 'Phone Number is required' })
		.min(9, 'Please enter a valid phone number'),
	profile_photo_url: z.url('Please upload a logo').optional(),
	date_of_birth: z
		.date()
		.refine((date) => {
			const today = new Date()
			const age = today.getFullYear() - date.getFullYear()
			return age >= 14
		}, 'You must be at least 14 years old')
		.optional(),
	gender: z.enum(['MALE', 'FEMALE'], { error: 'Please select a gender' }),
	employment_type: z.enum(['STUDENT', 'WORKER'], {
		error: 'Please select an employment type',
	}),
})

const gender: Array<{ label: string; value: TenantApplication['gender'] }> = [
	{ label: 'Male', value: 'MALE' },
	{ label: 'Female', value: 'FEMALE' },
]

const employment_type: Array<{
	label: string
	value: TenantApplication['employment_type']
}> = [
	{ label: 'Student', value: 'STUDENT' },
	{ label: 'Worker', value: 'WORKER' },
]

export type FormSchema = z.infer<typeof ValidationSchema>

export function Step1() {
	const { goBack, goNext, formData, updateFormData } =
		useCreatePropertyTenantApplicationContext()
	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			on_boarding_method: formData.on_boarding_method,
			employment_type: 'STUDENT',
		},
	})

	const {
		upload,
		objectUrl: profilePhotoUrl,
		isLoading: isUploading,
	} = useUploadObject('tenant-application/profile-pictures')

	const { watch, handleSubmit, formState, control, setValue } = rhfMethods

	useEffect(() => {
		if (profilePhotoUrl) {
			rhfMethods.setValue('profile_photo_url', profilePhotoUrl, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [profilePhotoUrl])

	useEffect(() => {
		if (formData.first_name) {
			setValue('first_name', formData.first_name, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.last_name) {
			setValue('last_name', formData.last_name, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.other_names) {
			setValue('other_names', formData.other_names, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.gender) {
			setValue('gender', formData.gender, {
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

		if (formData.phone) {
			setValue('phone', formData.phone, {
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
		if (formData.employment_type) {
			setValue('employment_type', formData.employment_type, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.profile_photo_url) {
			setValue('profile_photo_url', formData.profile_photo_url, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formData])

	const onSubmit = async (data: FormSchema) => {
		updateFormData({
			first_name: data.first_name,
			other_names: data.other_names,
			last_name: data.last_name,
			email: data.email,
			phone: data.phone,
			employment_type: data.employment_type,
			profile_photo_url: data.profile_photo_url,
			date_of_birth: data.date_of_birth?.toISOString(),
			gender: data.gender,
		})
		goNext()
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto my-5 space-y-10 md:max-w-2/3"
			>
				<div className="space-y-2">
					<TypographyH2 className="">Basic Information</TypographyH2>
					<TypographyMuted className=""></TypographyMuted>
				</div>

				<FieldGroup>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<FormField
							name="first_name"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>First Name</FormLabel>
									<FormControl>
										<Input type="text" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="other_names"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Other Names</FormLabel>
									<FormControl>
										<Input type="text" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="last_name"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Last Name</FormLabel>
									<FormControl>
										<Input type="text" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="gender"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Gender</FormLabel>
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select gender" />
											</SelectTrigger>
											<SelectContent>
												{gender.map((item) => (
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
						<FormField
							name="phone"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Phone</FormLabel>
									<FormControl>
										<Input {...field} type="text" />
									</FormControl>
									<FormDescription>
										We'll send notifications to this number
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

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

					<div className="w-full">
						<Label>Employment Type</Label>
						<div className="mt-3 flex space-x-3">
							{employment_type.map((employment_type) => {
								const isSelected =
									watch('employment_type') === employment_type.value
								return (
									<Button
										type="button"
										onClick={() =>
											setValue('employment_type', employment_type.value, {
												shouldDirty: true,
												shouldValidate: true,
											})
										}
										key={employment_type.value}
										variant={isSelected ? 'default' : 'outline'}
										className={cn('w-1/3', {
											'bg-rose-600 text-white': isSelected,
										})}
									>
										{employment_type.label}
									</Button>
								)
							})}
						</div>
						{formState.errors?.employment_type ? (
							<TypographySmall className="text-destructive mt-3">
								{formState.errors.employment_type.message}
							</TypographySmall>
						) : null}
					</div>
					<ImageUpload
						hero
						shape="square"
						hint="Optional"
						acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
						error={rhfMethods.formState.errors?.profile_photo_url?.message}
						fileCallback={upload}
						isUploading={isUploading}
						dismissCallback={() => {
							rhfMethods.setValue('profile_photo_url', undefined, {
								shouldDirty: true,
								shouldValidate: true,
							})
						}}
						imageSrc={safeString(rhfMethods.watch('profile_photo_url'))}
						label="Profile Picture"
						name="image_url"
						validation={{
							maxByteSize: 5242880, // 5MB
						}}
					/>
				</FieldGroup>

				<div className="mt-10 flex items-center justify-between space-x-5">
					<Button onClick={goBack} type="button" size="lg" variant="outline">
						<ArrowLeft />
						Go Back
					</Button>
					<Button
						size="lg"
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						Next <ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</form>
		</Form>
	)
}
