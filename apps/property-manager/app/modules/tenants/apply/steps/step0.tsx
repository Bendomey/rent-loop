import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Home } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLoaderData } from 'react-router'
import { z } from 'zod'
import { useTenantApplicationContext } from '../context'
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
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'
import type { loader } from '~/routes/tenants.apply._index'

const ValidationSchema = z.object({
	desired_unit_id: z.string({
		error: 'Invalid referral code',
	}),
	created_by_id: z.string({
		error: 'Invalid referral code',
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
	current_address: z
		.string({ error: 'Current Address is required' })
		.min(5, 'Please enter a valid address'),
	gender: z.enum(['MALE', 'FEMALE'], { error: 'Please select a gender' }),
	marital_status: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'], {
		error: 'Please select a marital status',
	}),
})

const gender: Array<{ label: string; value: TenantApplication['gender'] }> = [
	{ label: 'Male', value: 'MALE' },
	{ label: 'Female', value: 'FEMALE' },
]

const marital_status: Array<{
	label: string
	value: TenantApplication['marital_status']
}> = [
	{ label: 'Single', value: 'SINGLE' },
	{ label: 'Married', value: 'MARRIED' },
	{ label: 'Divorced', value: 'DIVORCED' },
	{ label: 'Widowed', value: 'WIDOWED' },
]

export type FormSchema = z.infer<typeof ValidationSchema>

export function Step0() {
	const { referredBy, unitId } = useLoaderData<typeof loader>()

	const { goNext, formData, updateFormData } = useTenantApplicationContext()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			marital_status: formData.marital_status || 'SINGLE',
			gender: formData.gender || 'MALE',
			created_by_id: formData.created_by_id || referredBy || undefined,
			desired_unit_id: formData.desired_unit_id || unitId || undefined,
		},
	})

	const {
		upload,
		objectUrl: profilePhotoUrl,
		isLoading: isUploading,
	} = useUploadObject('tenant-application/profile-pictures')

	const { handleSubmit, control, setValue } = rhfMethods

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

		if (formData.marital_status) {
			setValue('marital_status', formData.marital_status, {
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

		if (formData.current_address) {
			setValue('current_address', formData.current_address, {
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
			desired_unit_id: data.desired_unit_id,
			created_by_id: data.created_by_id,
			first_name: data.first_name,
			other_names: data.other_names,
			last_name: data.last_name,
			email: data.email,
			phone: data.phone,
			current_address: data.current_address,
			profile_photo_url: data.profile_photo_url,
			date_of_birth: data.date_of_birth?.toISOString(),
			gender: data.gender,
			marital_status: data.marital_status,
		})
		goNext()
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto my-8 space-y-8 md:max-w-2xl"
			>
				<Input type="hidden" {...rhfMethods.register('created_by_id')} />
				<Input type="hidden" {...rhfMethods.register('desired_unit_id')} />

				{/* Header Section */}
				<div className="space-y-3 border-b pb-6">
					<TypographyH2 className="text-3xl font-bold">
						Basic Information
					</TypographyH2>
					<TypographyMuted className="text-base leading-relaxed">
						Let's start by collecting your personal information
					</TypographyMuted>
				</div>

				<FieldGroup className="space-y-2">
					{/* Personal Details Grid */}
					<div className="space-y-5 rounded-lg border border-slate-100 bg-slate-50 p-5">
						<h3 className="text-lg font-semibold text-slate-900">
							Personal Details
						</h3>
						<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
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
								name="marital_status"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Marital Status</FormLabel>
										<FormControl>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select marital status" />
												</SelectTrigger>
												<SelectContent>
													{marital_status.map((item) => (
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
						</div>
					</div>

					{/* Contact & Address Section */}
					<div className="space-y-5 rounded-lg border border-slate-100 bg-slate-50 p-5">
						<h3 className="text-lg font-semibold text-slate-900">
							Contact Information
						</h3>
						<div className="space-y-5">
							<FormField
								name="current_address"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Address</FormLabel>
										<FormControl>
											<Input
												type="text"
												placeholder="e.g., East Legon, Accra"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>

					{/* Profile Picture Section */}
					<div className="space-y-5 rounded-lg border border-slate-100 bg-slate-50 p-5">
						<h3 className="text-lg font-semibold text-slate-900">
							Profile Picture
						</h3>
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
					</div>
				</FieldGroup>

				<div className="mt-12 flex items-center justify-between space-x-4">
					<Link to={`/`}>
						<Button type="button" size="lg" variant="outline">
							<Home className="mr-2 h-4 w-4" />
							Go Home
						</Button>
					</Link>
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
