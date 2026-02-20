import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useTenantApplicationContext } from '../context'
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
import { DocumentUpload } from '~/components/ui/document-upload'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'
import { toFirstUpperCase } from '~/lib/strings'
import { cn } from '~/lib/utils'

const employer_type: Array<{
	label: string
	value: TenantApplication['employer_type']
}> = [
	{ label: 'Student', value: 'STUDENT' },
	{ label: 'Worker', value: 'WORKER' },
]

const ValidationSchema = z.object({
	emergency_contact_name: z
		.string({ error: 'Emergency Contact Name is required' })
		.min(2, 'Please enter a valid name'),
	relationship_to_emergency_contact: z
		.string({ error: 'Relationship to Emergency Contact is required' })
		.min(2, 'Please enter a valid relationship'),
	emergency_contact_phone: z
		.string({ error: 'Phone Number is required' })
		.min(9, 'Please enter a valid phone number'),
	employer_type: z.enum(['STUDENT', 'WORKER'], {
		error: 'Please select an employment type',
	}),
	occupation: z.string().optional(),
	employer: z.string().optional(),
	occupation_address: z.string().optional(),
	proof_of_income_url: z.string().nullable().optional(),
})

type FormSchema = z.infer<typeof ValidationSchema>

interface FieldDisplayProps {
	label: string
	value: string | undefined | null
}

function FieldDisplay({ label, value }: FieldDisplayProps) {
	return (
		<div>
			<p className="text-muted-foreground text-sm">{label}</p>
			<p className="text-sm font-medium">{value || '-'}</p>
		</div>
	)
}

export function PropertyTenantApplicationEmergencyContact() {
	const { tenantApplication: application } = useTenantApplicationContext()

	const revalidator = useRevalidator()
	const [isEditing, setIsEditing] = useState(false)

	const {
		upload,
		objectUrl,
		isLoading: isUploading,
	} = useUploadObject('tenant-applications/proof-of-income')

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			emergency_contact_name: safeString(application?.emergency_contact_name),
			relationship_to_emergency_contact: safeString(
				application?.relationship_to_emergency_contact,
			),
			emergency_contact_phone: safeString(application?.emergency_contact_phone),
			employer_type: application?.employer_type || 'STUDENT',
			occupation: safeString(application?.occupation),
			employer: safeString(application?.employer),
			occupation_address: safeString(application?.occupation_address),
			proof_of_income_url: application?.proof_of_income_url ?? null,
		},
	})

	useEffect(() => {
		if (objectUrl) {
			rhfMethods.setValue('proof_of_income_url', objectUrl, {
				shouldDirty: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [objectUrl])

	const { handleSubmit, reset, watch, setValue } = rhfMethods
	const { isPending, mutate } = useUpdateTenantApplication()

	const isStudent = watch('employer_type') === 'STUDENT'

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
						'Failed to update emergency contact information. Try again later.',
					)
				},
				onSuccess: () => {
					toast.success('Emergency contact information updated successfully.')
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

	const viewIsStudent = application?.employer_type === 'STUDENT'

	if (!isEditing) {
		return (
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						Emergency Contact & Background
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
						Tenant's emergency contact information and background details.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="mb-2">
						<Label className="text-sm font-medium">Emergency Contact</Label>
					</div>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FieldDisplay
							label="Full Name"
							value={application?.emergency_contact_name}
						/>
						<FieldDisplay
							label="Relationship"
							value={application?.relationship_to_emergency_contact}
						/>
						<FieldDisplay
							label="Phone Number"
							value={application?.emergency_contact_phone}
						/>
					</div>

					<div className="mt-6 mb-2">
						<Label className="text-sm font-medium">Employment</Label>
					</div>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FieldDisplay
							label="Employment Type"
							value={
								application?.employer_type
									? toFirstUpperCase(application.employer_type)
									: undefined
							}
						/>
						{!viewIsStudent && (
							<FieldDisplay
								label="Occupation"
								value={application?.occupation}
							/>
						)}
						<FieldDisplay
							label={viewIsStudent ? 'Institution/School' : 'Employer'}
							value={application?.employer}
						/>
						<FieldDisplay
							label="Address"
							value={application?.occupation_address}
						/>
					</div>

					<div className="mt-6">
						<Label className="text-sm font-medium">
							Proof of {viewIsStudent ? 'Admission' : 'Income'}
						</Label>
						<div className="mt-2">
							{application?.proof_of_income_url ? (
								<DocumentUpload
									disabled
									documentName={`Proof of ${viewIsStudent ? 'Admission' : 'Income'}`}
									label={`Proof of ${viewIsStudent ? 'Admission' : 'Income'}`}
									name="proof_of_income_url"
									hideDismissIcon
								/>
							) : (
								<div className="flex h-16 w-full items-center justify-center rounded-md border bg-gray-50 text-sm text-gray-400">
									No document uploaded
								</div>
							)}
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
					Emergency Contact & Background
					<Button variant="ghost" size="sm" onClick={handleCancel}>
						<X className="mr-1 h-4 w-4" />
						Cancel
					</Button>
				</CardTitle>
				<CardDescription>
					Review and update tenant's emergency contact information and
					background details.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3">
				<Form {...rhfMethods}>
					<form id="emergency-contact-form" onSubmit={handleSubmit(onSubmit)}>
						<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
							<div className="col-span-2 mt-2">
								<Label>Emergency Contact</Label>
							</div>
							<div>
								<FormField
									name="emergency_contact_name"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Full Name <span className="text-red-500">*</span>
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
									name="relationship_to_emergency_contact"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Relationship <span className="text-red-500">*</span>
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
									name="emergency_contact_phone"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Phone Number <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input
													type="tel"
													placeholder="e.g., +233 54-123-4567"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="col-span-2 mt-2">
								<Label>Employment Type</Label>
								<small className="text-gray-500">
									Your current employment status
								</small>
							</div>
							<div className="col-span-2">
								<div className="flex space-x-3">
									{employer_type.map((employer_type) => {
										const isSelected =
											watch('employer_type') === employer_type.value
										return (
											<Button
												type="button"
												onClick={() =>
													setValue('employer_type', employer_type.value, {
														shouldDirty: true,
														shouldValidate: true,
													})
												}
												key={employer_type.value}
												variant={isSelected ? 'default' : 'outline'}
												className={cn('w-1/2', {
													'bg-rose-600 text-white': isSelected,
												})}
											>
												{employer_type.label}
											</Button>
										)
									})}
								</div>
							</div>

							<div className="col-span-2 mt-2">
								<Label>
									{isStudent ? 'Student Information' : 'Employment Information'}
								</Label>
							</div>
							<div className={isStudent ? 'col-span-2' : 'col-span-1'}>
								{!isStudent && (
									<FormField
										name="occupation"
										control={rhfMethods.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Occupation <span className="text-red-500">*</span>
												</FormLabel>
												<FormControl>
													<Input
														type="text"
														placeholder="e.g., Software Engineer"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							</div>
							<div>
								<FormField
									name="employer"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{isStudent ? 'Institution/School' : 'Employer'}{' '}
												<span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input
													type="text"
													placeholder={`e.g., ${isStudent ? 'Institution/School' : 'Company Name'}`}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className={isStudent ? 'col-span-1' : 'col-span-2'}>
								<FormField
									name="occupation_address"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Address <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input
													type="text"
													placeholder="e.g., 123 Business St, City, Country"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="col-span-2">
								<DocumentUpload
									hint="Optional"
									documentName={
										rhfMethods.watch('proof_of_income_url')
											? `Proof of ${isStudent ? 'Admission' : 'Income'}`
											: undefined
									}
									fileCallback={upload}
									isUploading={isUploading}
									dismissCallback={() =>
										rhfMethods.setValue('proof_of_income_url', null, {
											shouldDirty: true,
										})
									}
									label={`Proof of ${isStudent ? 'Admission' : 'Income'}`}
									name="proof_of_income_url"
									maxByteSize={5242880}
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
						form="emergency-contact-form"
						disabled={isPending || !rhfMethods.formState.isDirty}
					>
						{isPending ? <Spinner /> : null} Save
					</Button>
				</div>
			</CardFooter>
		</Card>
	)
}
