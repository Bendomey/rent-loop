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
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'

const ValidationSchema = z.object({
	nationality: z
		.string({ error: 'Nationality is required' })
		.min(2, 'Please enter a valid nationality'),
	id_type: z.enum(
		['DRIVERS_LICENSE', 'PASSPORT', 'NATIONAL_ID', 'STUDENT_ID'],
		{
			error: 'Please select an ID type',
		},
	),
	id_number: z
		.string({ error: 'ID number is required' })
		.min(2, 'Please enter a valid ID number'),
	id_front_url: z.url('Please upload the front side of the ID').optional(),
	id_back_url: z.url('Please upload the back side of the ID').optional(),
})

const idTypes: Array<{
	label: string
	value: 'DRIVERS_LICENSE' | 'PASSPORT' | 'NATIONAL_ID' | 'STUDENT_ID'
}> = [
	{ label: 'National ID', value: 'NATIONAL_ID' },
	{ label: 'Passport', value: 'PASSPORT' },
	{ label: "Driver's License", value: 'DRIVERS_LICENSE' },
	{ label: 'Student ID', value: 'STUDENT_ID' },
]

export type FormSchema = z.infer<typeof ValidationSchema>

export function Step2() {
	const { goBack, goNext, formData, updateFormData } =
		useCreatePropertyTenantApplicationContext()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})

	const {
		upload: uploadFront,
		objectUrl: frontUrl,
		isLoading: isUploadingFront,
	} = useUploadObject('tenant-applications/id-fronts')
	const {
		upload: uploadBack,
		objectUrl: backUrl,
		isLoading: isUploadingBack,
	} = useUploadObject('tenant-applications/id-backs')

	useEffect(() => {
		if (frontUrl) {
			rhfMethods.setValue('id_front_url', frontUrl, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (backUrl) {
			rhfMethods.setValue('id_back_url', backUrl, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [frontUrl, backUrl])

	const { handleSubmit, control, setValue } = rhfMethods

	useEffect(() => {
		if (formData.nationality) {
			setValue('nationality', formData.nationality, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.id_type) {
			setValue('id_type', formData.id_type as any, {
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
		if (formData.id_front_url) {
			setValue('id_front_url', formData.id_front_url, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.id_back_url) {
			setValue('id_back_url', formData.id_back_url, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formData])

	const onSubmit = async (data: FormSchema) => {
		updateFormData({
			nationality: data.nationality,
			id_type: data.id_type,
			id_number: data.id_number,
			id_front_url: data.id_front_url,
			id_back_url: data.id_back_url,
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
					<TypographyH2 className="text-2xl font-bold">
						Identity Verification
					</TypographyH2>
					<TypographyMuted className="text-base">
						Please provide your identification details and document images for
						verification.
					</TypographyMuted>
				</div>

				<FieldGroup className="space-y-4">
					{/* Nationality and ID Type */}
					<div className="">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								name="nationality"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nationality</FormLabel>
										<FormControl>
											<Input
												type="text"
												placeholder="e.g., Ghanaian"
												{...field}
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
												value={field.value || ''}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select ID type" />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														<SelectLabel>Document Type</SelectLabel>
														{idTypes.map((type) => (
															<SelectItem key={type.value} value={type.value}>
																{type.label}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="mt-8">
							<FormField
								name="id_number"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>ID Number</FormLabel>
										<FormControl>
											<Input
												type="text"
												placeholder="Enter your ID number"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>

					{/* ID Document Images */}
					<div className="space-y-4">
						<div className="space-y-1">
							<h3 className="font-semibold">ID Document Images</h3>
							<TypographyMuted>
								Upload clear photos of both sides of your ID
							</TypographyMuted>
						</div>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<ImageUpload
								hero
								shape="square"
								hint="Optional"
								acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
								error={rhfMethods.formState.errors?.id_front_url?.message}
								fileCallback={uploadFront}
								isUploading={isUploadingFront}
								dismissCallback={() => {
									rhfMethods.setValue('id_front_url', undefined, {
										shouldDirty: true,
										shouldValidate: true,
									})
								}}
								imageSrc={safeString(rhfMethods.watch('id_front_url'))}
								label="Front of ID"
								name="id_front"
								validation={{
									maxByteSize: 5242880, // 5MB
								}}
							/>

							<ImageUpload
								hero
								shape="square"
								hint="Optional"
								acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
								error={rhfMethods.formState.errors?.id_back_url?.message}
								fileCallback={uploadBack}
								isUploading={isUploadingBack}
								dismissCallback={() => {
									rhfMethods.setValue('id_back_url', undefined, {
										shouldDirty: true,
										shouldValidate: true,
									})
								}}
								imageSrc={safeString(rhfMethods.watch('id_back_url'))}
								label="Back of ID"
								name="id_back"
								validation={{
									maxByteSize: 5242880, // 5MB
								}}
							/>
						</div>
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
						Next <ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</form>
		</Form>
	)
}
