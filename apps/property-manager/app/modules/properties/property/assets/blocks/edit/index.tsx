import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useGetPropertyBlock, useUpdatePropertyBlock } from '~/api/blocks'
import { ErrorContainer } from '~/components/ErrorContainer'
import { LoadingContainer } from '~/components/LoadingContainer'
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
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'

const ValidationSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	image_url: z
		.string()
		.url('Please upload an image')
		.optional()
		.or(z.literal('')),
	description: z
		.string()
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	status: z.enum(
		[
			'PropertyBlock.Status.Active',
			'PropertyBlock.Status.Maintenance',
			'PropertyBlock.Status.Inactive',
		],
		{ error: 'Please select a status' },
	),
})

type FormSchema = z.infer<typeof ValidationSchema>

const statusOptions: Array<{ label: string; value: FormSchema['status'] }> = [
	{ label: 'Active', value: 'PropertyBlock.Status.Active' },
	{ label: 'Inactive', value: 'PropertyBlock.Status.Inactive' },
	{ label: 'Maintenance', value: 'PropertyBlock.Status.Maintenance' },
]

export function EditPropertyAssetBlocksModule() {
	const { clientUserProperty } = useProperty()
	const navigate = useNavigate()
	const { blockId } = useParams()

	const {
		isPending: isLoadingData,
		data,
		error,
	} = useGetPropertyBlock({
		property_id: clientUserProperty?.property?.id ?? '',
		id: blockId ?? '',
	})
	const { mutate, isPending } = useUpdatePropertyBlock()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			name: '',
			description: '',
			image_url: '',
			status: 'PropertyBlock.Status.Active',
		},
	})

	const {
		upload,
		objectUrl,
		isLoading: isUploading,
	} = useUploadObject('blocks/images')

	// Reset form when data loads
	useEffect(() => {
		if (data) {
			rhfMethods.reset({
				name: data.name ?? '',
				description: data.description ?? '',
				image_url: data.images?.[0] ?? '',
				status: data.status ?? 'PropertyBlock.Status.Active',
			})
		}
	}, [data, rhfMethods])

	// Update form when new image is uploaded
	useEffect(() => {
		if (objectUrl) {
			rhfMethods.setValue('image_url', objectUrl, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
	}, [objectUrl, rhfMethods])

	const onSubmit = async (formData: FormSchema) => {
		mutate(
			{
				id: blockId ?? '',
				data: {
					property_id: clientUserProperty?.property?.id ?? '',
					name: formState.dirtyFields.name ? formData.name : undefined,
					description: formState.dirtyFields.description
						? formData.description
						: undefined,
					images:
						formState.dirtyFields.image_url && formData.image_url
							? [formData.image_url]
							: undefined,
					status: formState.dirtyFields.status ? formData.status : undefined,
				},
			},
			{
				onError: () =>
					toast.error('Failed to update property block. Try again later.'),
				onSuccess: () => {
					toast.success('Property block has been successfully updated')
					void navigate(
						`/properties/${clientUserProperty?.property?.id}/assets/blocks`,
					)
				},
			},
		)
	}

	const { watch, formState, setValue } = rhfMethods

	if (isLoadingData) return <LoadingContainer />
	if (error) return <ErrorContainer className="h-4/5 border-none" />

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={rhfMethods.handleSubmit(onSubmit)}
				className="mx-6 my-6 space-y-6 md:mx-auto md:max-w-2/3"
			>
				<div className="space-y-2">
					<TypographyH2>Edit {data ? data.name : 'Block'}</TypographyH2>
					<TypographyMuted>
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

					<div className="flex flex-col items-center space-x-6 md:flex-row">
						<FormLabel>Status: </FormLabel>
						<div className="flex space-x-3">
							{statusOptions.map((option) => {
								const isSelected = watch('status') === option.value
								return (
									<Button
										type="button"
										onClick={() =>
											setValue('status', option.value, {
												shouldDirty: true,
												shouldValidate: true,
											})
										}
										key={option.value}
										variant={isSelected ? 'default' : 'outline'}
										className={cn({ 'bg-rose-600 text-white': isSelected })}
									>
										{option.label}
									</Button>
								)
							})}
						</div>
						{formState.errors?.status && (
							<TypographySmall className="text-destructive mt-3">
								{formState.errors.status.message}
							</TypographySmall>
						)}
					</div>

					<ImageUpload
						hero
						shape="square"
						hint="Optional"
						acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
						error={formState.errors?.image_url?.message}
						fileCallback={upload}
						isUploading={isUploading}
						dismissCallback={() => {
							setValue('image_url', '', {
								shouldDirty: true,
								shouldValidate: true,
							})
						}}
						imageSrc={safeString(watch('image_url') ?? '')}
						label="Block Image"
						name="image_url"
						validation={{ maxByteSize: 5242880 }} // 5MB
					/>
				</FieldGroup>

				<div className="mt-10 flex items-center justify-end space-x-5">
					<Link to="..">
						<Button
							type="button"
							size="sm"
							variant="ghost"
							disabled={isPending}
						>
							<ArrowLeft /> Cancel
						</Button>
					</Link>
					<Button
						disabled={isPending || !formState.isDirty}
						size="lg"
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						{isPending && <Spinner />} Update
					</Button>
				</div>
			</form>
		</Form>
	)
}
