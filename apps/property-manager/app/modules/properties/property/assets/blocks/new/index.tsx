import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
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
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'

const ValidationSchema = z.object({
	name: z.string({ error: 'Name is required' }),
	image_url: z.url('Please upload an image').optional(),
	description: z
		.string()
		.max(500, 'Description must be less than 500 characters')
		.optional(),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function NewPropertyAssetBlocksModule() {
	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})

	const {
		upload,
		objectUrl,
		isLoading: isUploading,
	} = useUploadObject('blocks/images')

	useEffect(() => {
		if (objectUrl) {
			rhfMethods.setValue('image_url', objectUrl, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [objectUrl])

	const onSubmit = (_: FormSchema) => {}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={rhfMethods.handleSubmit(onSubmit)}
				className="mx-6 my-6 space-y-6 md:mx-auto md:max-w-2/3"
			>
				<div className="space-y-2">
					<TypographyH2 className="">Add New Block</TypographyH2>
					<TypographyMuted className="">
						We break down property assets into blocks to better organize and
						manage them.
					</TypographyMuted>
				</div>

				<FieldGroup>
					<FormField
						name="name"
						control={rhfMethods.control}
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

					<FormField
						name="description"
						control={rhfMethods.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Property Details</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Add any additional details about this block"
										rows={5}
										{...field}
									/>
								</FormControl>
								<FormMessage />
								<FormDescription>Optional</FormDescription>
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
						label="Block Image"
						name="image_url"
						validation={{
							maxByteSize: 5242880, // 5MB
						}}
					/>
				</FieldGroup>

				<div className="mt-10 flex items-center justify-end space-x-5">
					<Link to="..">
						<Button type="button" size="sm" variant="ghost">
							<ArrowLeft />
							Cancel
						</Button>
					</Link>
					<Button
						size="lg"
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						Submit
					</Button>
				</div>
			</form>
		</Form>
	)
}
