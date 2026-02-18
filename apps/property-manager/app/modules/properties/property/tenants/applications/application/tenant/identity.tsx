import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRevalidator, useRouteLoaderData } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUpdateTenantApplication } from '~/api/tenant-applications'
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
	SelectItem,
	SelectTrigger,
	SelectValue,
	SelectContent,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { safeString } from '~/lib/strings'
import type { loader } from '~/routes/_auth.properties.$propertyId.tenants.applications.$applicationId'

const ID_TYPE_LABELS: Record<string, string> = {
	NATIONAL_ID: 'National ID',
	PASSPORT: 'Passport',
	DRIVERS_LICENSE: "Driver's License",
	GHANA_CARD: 'Ghana Card',
}

const ValidationSchema = z.object({
	nationality: z.string().trim().min(1, 'Nationality is required'),
	id_type: z.enum(['DRIVERS_LICENSE', 'PASSPORT', 'NATIONAL_ID', 'GHANA_CARD'], {
		message: 'Please select an ID type',
	}),
	id_number: z.string().trim().min(1, 'ID number is required'),
	current_address: z.string().trim().min(1, 'Current address is required'),
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

export function PropertyTenantApplicationIdentity() {
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>(
		'routes/_auth.properties.$propertyId.tenants.applications.$applicationId',
	)
	const revalidator = useRevalidator()
	const application = loaderData?.tenantApplication
	const [isEditing, setIsEditing] = useState(false)

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			nationality: safeString(application?.nationality),
			id_type: application?.id_type || undefined,
			id_number: safeString(application?.id_number),
			current_address: safeString(application?.current_address),
		},
	})

	const { handleSubmit, reset } = rhfMethods
	const { isPending, mutate } = useUpdateTenantApplication()

	const onSubmit = (data: FormSchema) => {
		if (!application?.id) return

		mutate(
			{
				id: application.id,
				data,
			},
			{
				onError: () => {
					toast.error(
						'Failed to update identity information. Try again later.',
					)
				},
				onSuccess: () => {
					toast.success('Identity information updated successfully.')
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
						Identity Verification
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
						Tenant's identification details for verification.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FieldDisplay
							label="Nationality"
							value={application?.nationality}
						/>
						<FieldDisplay
							label="ID Type"
							value={
								application?.id_type
									? ID_TYPE_LABELS[application.id_type] || application.id_type
									: undefined
							}
						/>
						<FieldDisplay label="ID Number" value={application?.id_number} />
						<FieldDisplay
							label="Current Address"
							value={application?.current_address}
						/>
					</div>

						<div className="mt-6">
						<Label className="text-sm font-medium">ID Document Images</Label>
						<div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<p className="mb-1 text-xs text-muted-foreground">Front</p>
								{application?.id_front_url ? (
									<img
										src={application.id_front_url}
										alt="ID Front"
										className="h-40 w-full rounded-md border object-cover"
									/>
								) : (
									<div className="flex h-40 w-full items-center justify-center rounded-md border bg-gray-50 text-sm text-gray-400">
										No image uploaded
									</div>
								)}
							</div>
							<div>
								<p className="mb-1 text-xs text-muted-foreground">Back</p>
								{application?.id_back_url ? (
									<img
										src={application.id_back_url}
										alt="ID Back"
										className="h-40 w-full rounded-md border object-cover"
									/>
								) : (
									<div className="flex h-40 w-full items-center justify-center rounded-md border bg-gray-50 text-sm text-gray-400">
										No image uploaded
									</div>
								)}
							</div>
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
					Identity Verification
					<Button variant="ghost" size="sm" onClick={handleCancel}>
						<X className="mr-1 h-4 w-4" />
						Cancel
					</Button>
				</CardTitle>
				<CardDescription>
					Review and update tenant's identification details.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3">
				<Form {...rhfMethods}>
					<form id="identity-form" onSubmit={handleSubmit(onSubmit)}>
						<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
							<div>
								<FormField
									name="nationality"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Nationality <span className="text-red-500">*</span>
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
									name="id_type"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												ID Type <span className="text-red-500">*</span>
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
														<SelectItem value="NATIONAL_ID">
															National ID
														</SelectItem>
														<SelectItem value="PASSPORT">Passport</SelectItem>
														<SelectItem value="DRIVERS_LICENSE">
															Driver's License
														</SelectItem>
														<SelectItem value="GHANA_CARD">
															Ghana Card
														</SelectItem>
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
									name="id_number"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												ID Number <span className="text-red-500">*</span>
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
									name="current_address"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Current Address{' '}
												<span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="col-span-2 mt-2">
								<Label>ID Document Images</Label>
							</div>
							<div className="col-span-1">
								<ImageUpload
									hero
									shape="square"
									hint="Optional"
									acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
									imageSrc={safeString(application?.id_front_url)}
									label="ID Front"
									name="id_front_url"
									validation={{
										maxByteSize: 5242880,
									}}
								/>
							</div>
							<div className="col-span-1">
								<ImageUpload
									hero
									shape="square"
									hint="Optional"
									acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
									imageSrc={safeString(application?.id_back_url)}
									label="ID Back"
									name="id_back_url"
									validation={{
										maxByteSize: 5242880,
									}}
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
						form="identity-form"
						disabled={isPending || !rhfMethods.formState.isDirty}
					>
						{isPending ? <Spinner /> : null} Save
					</Button>
				</div>
			</CardFooter>
		</Card>
	)
}
