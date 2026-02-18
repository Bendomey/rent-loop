import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRevalidator, useRouteLoaderData } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUpdateTenantApplication } from '~/api/tenant-applications'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
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
	SelectItem,
	SelectTrigger,
	SelectValue,
	SelectContent,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { safeString } from '~/lib/strings'
import { toFirstUpperCase } from '~/lib/strings'
import type { loader } from '~/routes/_auth.properties.$propertyId.tenants.applications.$applicationId'

const ValidationSchema = z.object({
	first_name: z.string().trim().min(1, 'First name is required'),
	last_name: z.string().trim().min(1, 'Last name is required'),
	other_names: z.string().optional(),
	gender: z.enum(['MALE', 'FEMALE'], { message: 'Please select a gender' }),
	marital_status: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'], {
		message: 'Please select a marital status',
	}),
	email: z.string().email('Please enter a valid email'),
	phone: z.string().trim().min(1, 'Phone is required'),
	date_of_birth: z.date({ message: 'Date of birth is required' }),
})

type FormSchema = z.infer<typeof ValidationSchema>

interface FieldDisplayProps {
	label: string
	value: string | undefined | null
}

function FieldDisplay({ label, value }: FieldDisplayProps) {
	return (
		<div>
			<p className="text-sm text-muted-foreground">{label}</p>
			<p className="text-sm font-medium">{value || '-'}</p>
		</div>
	)
}

export function PropertyTenantApplicationBasic() {
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>(
		'routes/_auth.properties.$propertyId.tenants.applications.$applicationId',
	)
	const revalidator = useRevalidator()
	const application = loaderData?.tenantApplication
	const [isEditing, setIsEditing] = useState(false)

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			first_name: safeString(application?.first_name),
			last_name: safeString(application?.last_name),
			other_names: safeString(application?.other_names) || '',
			gender: application?.gender || 'MALE',
			marital_status: application?.marital_status || 'SINGLE',
			email: safeString(application?.email),
			phone: safeString(application?.phone),
			date_of_birth: application?.date_of_birth
				? new Date(application.date_of_birth)
				: undefined,
		},
	})

	const { handleSubmit, reset } = rhfMethods
	const { isPending, mutate } = useUpdateTenantApplication()

	const onSubmit = (data: FormSchema) => {
		if (!application?.id) return

		mutate(
			{
				id: application.id,
				data: {
					...data,
					date_of_birth: data.date_of_birth.toISOString(),
				},
			},
			{
				onError: () => {
					toast.error('Failed to update basic information. Try again later.')
				},
				onSuccess: () => {
					toast.success('Basic information updated successfully.')
					void revalidator.revalidate()
					setIsEditing(false)
				},
			},
		)
	}

	const handleCancel = () => {
		reset()
		setIsEditing(false)
	}

	if (!isEditing) {
		return (
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						Basic Information
						{application?.status !== 'TenantApplication.Status.Cancelled' && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsEditing(true)}
							>
								<Pencil className="mr-1 h-4 w-4" />
								Edit
							</Button>
						)}
					</CardTitle>
					<CardDescription>
						Tenant's basic personal information.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="flex gap-6">
						<div className="shrink-0">
							{application?.profile_photo_url ? (
								<img
									src={application.profile_photo_url}
									alt="Profile"
									className="h-24 w-24 rounded-full border object-cover"
								/>
							) : (
								<div className="flex h-24 w-24 items-center justify-center rounded-full border bg-gray-50 text-sm text-gray-400">
									No photo
								</div>
							)}
						</div>
						<div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
						<FieldDisplay label="First Name" value={application?.first_name} />
						<FieldDisplay label="Last Name" value={application?.last_name} />
						<FieldDisplay
							label="Other Names"
							value={application?.other_names}
						/>
						<FieldDisplay
							label="Gender"
							value={
								application?.gender
									? toFirstUpperCase(application.gender)
									: undefined
							}
						/>
						<FieldDisplay
							label="Marital Status"
							value={
								application?.marital_status
									? toFirstUpperCase(application.marital_status)
									: undefined
							}
						/>
						<FieldDisplay label="Email" value={application?.email} />
						<FieldDisplay label="Phone" value={application?.phone} />
						<FieldDisplay
							label="Date of Birth"
							value={
								application?.date_of_birth
									? dayjs(application.date_of_birth).format('MMM D, YYYY')
									: undefined
							}
						/>
						</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					Basic Information
					<Button variant="ghost" size="sm" onClick={handleCancel}>
						<X className="mr-1 h-4 w-4" />
						Cancel
					</Button>
				</CardTitle>
				<CardDescription>
					Review and update tenant's basic information.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3">
				<ImageUpload
					hero
					shape="circle"
					hint="Optional"
					acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
					imageSrc={safeString(application?.profile_photo_url)}
					label="Profile Photo"
					name="profile_photo_url"
					validation={{
						maxByteSize: 5242880,
					}}
				/>
				<Form {...rhfMethods}>
					<form
						id="basic-info-form"
						onSubmit={handleSubmit(onSubmit)}
					>
						<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
							<div>
								<FormField
									name="first_name"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												First Name <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div>
								<FormField
									name="last_name"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Last Name <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="col-span-2">
								<FormField
									name="other_names"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Other Names</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
											<FormDescription>Optional</FormDescription>
										</FormItem>
									)}
								/>
							</div>
							<div>
								<FormField
									name="gender"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Gender <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Please select" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="MALE">Male</SelectItem>
														<SelectItem value="FEMALE">Female</SelectItem>
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div>
								<FormField
									name="marital_status"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Marital Status{' '}
												<span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Please select" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="SINGLE">Single</SelectItem>
														<SelectItem value="MARRIED">Married</SelectItem>
														<SelectItem value="DIVORCED">
															Divorced
														</SelectItem>
														<SelectItem value="WIDOWED">Widowed</SelectItem>
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div>
								<FormField
									name="email"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input {...field} type="text" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div>
								<FormField
									name="phone"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Phone <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input {...field} type="text" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="col-span-2">
								<FormField
									name="date_of_birth"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Date of birth{' '}
												<span className="text-red-500">*</span>
											</FormLabel>
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
							</div>
						</div>
					</form>
				</Form>
			</CardContent>

			<CardFooter className="flex justify-end">
				<div className="flex flex-row items-center space-x-2">
					<Button variant="outline" onClick={handleCancel} disabled={isPending}>
						Cancel
					</Button>
					<Button
						type="submit"
						form="basic-info-form"
						disabled={isPending || !rhfMethods.formState.isDirty}
					>
						{isPending ? <Spinner /> : null} Save
					</Button>
				</div>
			</CardFooter>
		</Card>
	)
}
