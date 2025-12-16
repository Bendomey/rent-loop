import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreatePropertyUnitContext } from '../context'
import { FeatureInput } from '~/components/feature'
import { PropertyTagInput } from '~/components/property-tag'
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
import { Textarea } from '~/components/ui/textarea'
import { TypographyH2 } from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'

const ValidationSchema = z.object({
	name: z
		.string({ error: 'Name is required' })
		.min(2, 'Please enter a valid name'),
	image_url: z.url('Please upload an image').optional(),
	description: z
		.string()
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	tags: z.array(z.string().min(1).max(10)).optional(),
	features: z.record(z.string(), z.string()).optional(),
})

export type FormSchema = z.infer<typeof ValidationSchema>

export function Step1() {
	const { goBack, goNext, formData, updateFormData } =
		useCreatePropertyUnitContext()
	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})

	const {
		upload,
		objectUrl,
		isLoading: isUploading,
	} = useUploadObject('property/images')

	useEffect(() => {
		if (objectUrl) {
			rhfMethods.setValue('image_url', objectUrl, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [objectUrl])

	const { handleSubmit, control, setValue } = rhfMethods

	useEffect(() => {
		if (formData.name) {
			setValue('name', formData.name, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData?.images?.length) {
			setValue('image_url', formData.images[0], {
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
		if (formData.tags) {
			setValue('tags', formData.tags, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.features) {
			setValue('features', formData.features, {
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
			tags: data.tags,
			features: data.features,
			images: data.image_url ? [data.image_url] : [],
		})
		goNext()
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto my-5 space-y-8 md:max-w-2/3"
			>
				<TypographyH2 className="">Basic Information</TypographyH2>
				<div className="space-y-10">
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

						<ImageUpload
							hero
							shape="square"
							hint="Optional"
							acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
							error={rhfMethods.formState.errors?.image_url?.message}
							fileCallback={upload}
							isUploading={isUploading}
							dismissCallback={() => {
								rhfMethods.setValue('image_url', undefined, {
									shouldDirty: true,
									shouldValidate: true,
								})
							}}
							imageSrc={safeString(rhfMethods.watch('image_url'))}
							label="Property Unit Image"
							name="image_url"
							validation={{
								maxByteSize: 5242880, // 5MB
							}}
						/>

						<FormField
							name="description"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Unit Details</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Briefly describe your property unit (e.g., size, features, or highlights)..."
											rows={5}
											{...field}
										/>
									</FormControl>
									<FormMessage />
									<FormDescription>Optional</FormDescription>
								</FormItem>
							)}
						/>

						<FeatureInput />
						<PropertyTagInput />
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
				</div>
			</form>
		</Form>
	)
}
