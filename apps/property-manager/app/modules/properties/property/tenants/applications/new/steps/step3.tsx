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
} from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'

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
	occupation: z.string().optional(),
	employer: z.string().optional(),
	occupation_address: z.string().optional(),
	proof_of_income_url: z.url('Please upload proof of income').optional(),
})

export type FormSchema = z.infer<typeof ValidationSchema>

export function Step3() {
	const { goBack, goNext, formData, updateFormData } =
		useCreatePropertyTenantApplicationContext()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
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

	const { handleSubmit, control, setValue } = rhfMethods

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
			occupation: data.occupation,
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
					<TypographyH2>Emergency Contact & Employment</TypographyH2>
					<TypographyMuted className="text-base">
						Please provide your emergency contact information and employment
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
										<FormLabel>Full Name</FormLabel>
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
										<FormLabel>Relationship</FormLabel>
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
									<FormLabel>Phone Number</FormLabel>
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
					<div className="space-y-4 border-t pt-6">
						<div className="space-y-1">
							<TypographyH4>Employment Information</TypographyH4>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

							<FormField
								name="employer"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Employer</FormLabel>
										<FormControl>
											<Input
												type="text"
												placeholder="e.g., Company Name"
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
									<FormLabel>Employer Address</FormLabel>
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
							<h3 className="font-semibold">Proof of Income</h3>
							<TypographyMuted>
								Upload a document proving your income (pay stub, tax return,
								etc.)
							</TypographyMuted>
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
							label="Proof of Income"
							name="proof_of_income"
							validation={{
								maxByteSize: 5242880, // 5MB
							}}
						/>
					</div>
				</FieldGroup>

				<div className="mt-10 flex items-center justify-between border-t pt-6">
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
