import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreatePropertyTenantApplicationContext } from '../context'
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
import { ImageUpload } from '~/components/ui/image-upload'
import { Input } from '~/components/ui/input'
import {
	TypographyH2,
	TypographyH4,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'

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
	proof_of_income_url: z.url('Please upload proof of income').optional(),
})

const employer_type: Array<{
	label: string
	value: TenantApplication['employer_type']
}> = [
	{ label: 'Student', value: 'STUDENT' },
	{ label: 'Worker', value: 'WORKER' },
]

export type FormSchema = z.infer<typeof ValidationSchema>

export function Step3() {
	const { goBack, goNext, formData, updateFormData } =
		useCreatePropertyTenantApplicationContext()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			employer_type: 'STUDENT',
		},
	})

	const {
		upload: uploadProofOfIncome,
		objectUrl: proofOfIncomeUrl,
		isLoading: isUploadingProofOfIncome,
	} = useUploadObject('tenant-applications/proof-of-income')

	useEffect(() => {
		if (proofOfIncomeUrl) {
			rhfMethods.setValue('proof_of_income_url', proofOfIncomeUrl, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [proofOfIncomeUrl])

	const { watch, handleSubmit, formState, control, setValue } = rhfMethods

	const isStudent = watch('employer_type') === 'STUDENT'

	useEffect(() => {
		if (formData.emergency_contact_name) {
			setValue('emergency_contact_name', formData.emergency_contact_name, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.relationship_to_emergency_contact) {
			setValue(
				'relationship_to_emergency_contact',
				formData.relationship_to_emergency_contact,
				{
					shouldDirty: true,
					shouldValidate: true,
				},
			)
		}
		if (formData.emergency_contact_phone) {
			setValue('emergency_contact_phone', formData.emergency_contact_phone, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.employer_type) {
			setValue('employer_type', formData.employer_type, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.occupation) {
			setValue('occupation', formData.occupation, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.employer) {
			setValue('employer', formData.employer, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.occupation_address) {
			setValue('occupation_address', formData.occupation_address, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.proof_of_income_url) {
			setValue('proof_of_income_url', formData.proof_of_income_url, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formData])

	const onSubmit = async (data: FormSchema) => {
		updateFormData({
			emergency_contact_name: data.emergency_contact_name,
			relationship_to_emergency_contact: data.relationship_to_emergency_contact,
			emergency_contact_phone: data.emergency_contact_phone,
			employer_type: data.employer_type,
			occupation:
				data.employer_type === 'STUDENT'
					? data.employer_type
					: data.occupation,
			employer: data.employer,
			occupation_address: data.occupation_address,
			proof_of_income_url: data.proof_of_income_url,
		})
		goNext()
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto my-8 space-y-8 md:max-w-2xl"
			>
				{/* Header Section */}
				<div className="space-y-2 border-b pb-6">
					<TypographyH2>
						Emergency Contact & Background Information
					</TypographyH2>
					<TypographyMuted className="text-base">
						Please provide your emergency contact information and background
						details.
					</TypographyMuted>
				</div>

				<FieldGroup className="space-y-6">
					{/* Emergency Contact Section */}
					<div className="space-y-4">
						<div className="space-y-1">
							<TypographyH4>Emergency Contact</TypographyH4>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								name="emergency_contact_name"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Full Name <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												type="text"
												placeholder="Enter full name"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								name="relationship_to_emergency_contact"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Relationship <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												type="text"
												placeholder="e.g., Sibling, Parent, Friend"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							name="emergency_contact_phone"
							control={control}
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

					{/* Employment Section */}
					<div className="space-y-4 border-t pt-4">
						<div className="w-full">
							<TypographyH4>Employment Type</TypographyH4>
							<TypographyMuted className="mb-3 text-sm">
								Select your current employment status
							</TypographyMuted>

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
							{formState.errors?.employer_type ? (
								<TypographySmall className="text-destructive mt-3">
									{formState.errors.employer_type.message}
								</TypographySmall>
							) : null}
						</div>

						<div className="space-y-1">
							<TypographyH4>
								{isStudent ? 'Student Information' : 'Employment Information'}
							</TypographyH4>
						</div>
						<div
							className={`grid grid-cols-1 gap-4 ${isStudent ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}
						>
							{!isStudent && (
								<FormField
									name="occupation"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Occupation</FormLabel>
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

							<FormField
								name="employer"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{isStudent ? 'Institution/School' : 'Employer'}
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

						<FormField
							name="occupation_address"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Address</FormLabel>
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

					{/* Proof of Income */}
					<div className="space-y-4 border-t pt-6">
						<div className="space-y-1">
							{isStudent ? (
								<>
									<h3 className="font-semibold">Proof of Admission</h3>
									<TypographyMuted>
										Upload a document proving your admission (acceptance letter,
										enrollment verification, etc.)
									</TypographyMuted>
								</>
							) : (
								<>
									<h3 className="font-semibold">Proof of Income</h3>
									<TypographyMuted>
										Upload a document proving your income (pay stub, tax return,
										etc.)
									</TypographyMuted>
								</>
							)}
						</div>

						<ImageUpload
							hero
							shape="square"
							hint="Optional"
							acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
							error={rhfMethods.formState.errors?.proof_of_income_url?.message}
							fileCallback={uploadProofOfIncome}
							isUploading={isUploadingProofOfIncome}
							dismissCallback={() => {
								rhfMethods.setValue('proof_of_income_url', undefined, {
									shouldDirty: true,
									shouldValidate: true,
								})
							}}
							imageSrc={safeString(rhfMethods.watch('proof_of_income_url'))}
							label={`${isStudent ? 'Proof of Admission' : 'Proof of Income'}`}
							name="proof_of_income"
							validation={{
								maxByteSize: 5242880, // 5MB
							}}
						/>
					</div>
				</FieldGroup>

				<div className="mt-12 flex items-center justify-between border-t pt-8">
					<Button onClick={goBack} type="button" size="lg" variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Go Back
					</Button>
					<Button
						size="lg"
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						Preview & Submit
						<ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</form>
		</Form>
	)
}
