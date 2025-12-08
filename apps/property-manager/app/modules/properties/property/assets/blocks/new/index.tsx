import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCreatePropertyBlock } from '~/api/blocks'
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
	name: z.string({ error: 'Name is required' }),
	images: z
		.array(z.string().url('Please provide a valid image url'))
		.optional(),
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
		{
			error: 'Please select a status',
		},
	),
})

type FormSchema = z.infer<typeof ValidationSchema>

const status: Array<{ label: string; value: PropertyBlock['status'] }> = [
	{ label: 'Active', value: 'PropertyBlock.Status.Active' },
	{ label: 'Inactive', value: 'PropertyBlock.Status.Inactive' },
	{ label: 'Maintenance', value: 'PropertyBlock.Status.Maintenance' },
]

export function NewPropertyAssetBlocksModule() {
	const { clientUserProperty } = useProperty()
	const navigate = useNavigate()

	const rhfMethods = useForm<FormSchema>({
		defaultValues: {
			name: '',
			description: '',
			images: [],
			status: 'PropertyBlock.Status.Active',
		},
		resolver: zodResolver(ValidationSchema),
	})

	const {
		upload,
		objectUrl,
		isLoading: isUploading,
	} = useUploadObject('blocks/images')

	useEffect(() => {
		if (objectUrl) {
			const prev: string[] = rhfMethods.getValues('images') ?? []
			rhfMethods.setValue('images', [...prev, objectUrl], {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [objectUrl])

	const { mutate, isPending } = useCreatePropertyBlock()

	const onSubmit = async (data: FormSchema) => {
		if (data) {
			mutate(
				{
					property_id: clientUserProperty?.property?.id ?? '',
					name: data.name,
					description: data.description,
					images: data.images,
					status: data.status,
				},
				{
					onError: () => {
						toast.error(`Failed to create property block. Try again later.`)
					},
					onSuccess: () => {
						toast.success(`Property block has been successfully created`)
						setTimeout(() => {
							void navigate(
								`/properties/${clientUserProperty?.property?.id}/assets/blocks`,
							)
						}, 1000)
					},
				},
			)
		}
	}

	const { watch, formState, setValue } = rhfMethods

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

					<div className="flex flex-col items-center space-x-6 md:flex-row">
						<FormLabel>Status: </FormLabel>
						<div className="flex space-x-3">
							{status.map((status) => {
								const isSelected = watch('status') === status.value
								return (
									<Button
										type="button"
										onClick={() =>
											setValue('status', status.value, {
												shouldDirty: true,
												shouldValidate: true,
											})
										}
										key={status.value}
										variant={isSelected ? 'default' : 'outline'}
										className={cn({ 'bg-rose-600 text-white': isSelected })}
									>
										{status.label}
									</Button>
								)
							})}
						</div>
						{formState.errors?.status ? (
							<TypographySmall className="text-destructive mt-3">
								{formState.errors.status.message}
							</TypographySmall>
						) : null}
					</div>

					<ImageUpload
						hero
						shape="square"
						hint="Optional"
						acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
						error={rhfMethods.formState.errors?.images?.message}
						fileCallback={upload}
						isUploading={isUploading}
						dismissCallback={() => {
							rhfMethods.setValue('images', undefined, {
								shouldDirty: true,
								shouldValidate: true,
							})
						}}
						imageSrc={safeString(rhfMethods.watch('images')?.[0])}
						label="Block Image"
						name="images"
						validation={{
							maxByteSize: 5242880, // 5MB
						}}
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
							<ArrowLeft />
							Cancel
						</Button>
					</Link>
					<Button
						disabled={isPending}
						size="lg"
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						{isPending ? <Spinner /> : null} Submit
					</Button>
				</div>
			</form>
		</Form>
	)
}
