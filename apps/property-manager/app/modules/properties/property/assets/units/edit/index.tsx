import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
	ArrowLeft,
	Briefcase,
	Building2,
	Home,
	Info,
	LayoutGrid,
	Store,
} from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useRouteLoaderData } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUpdatePropertyUnit } from '~/api/units'
import { FeatureInput } from '~/components/feature'
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
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.assets.units.$unitId'

const ValidationSchema = z.object({
	name: z
		.string({ error: 'Name is required' })
		.min(2, 'Please enter a valid name'),
	image_url: z
		.string()
		.url('Please upload an image')
		.optional()
		.or(z.literal('')),
	description: z
		.string()
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	features: z.record(z.string(), z.string()).optional(),
	type: z.enum(['APARTMENT', 'HOUSE', 'STUDIO', 'OFFICE', 'RETAIL'], {
		error: 'Please select a type',
	}),
	area: z.number().positive('Area must be a positive number').optional(),
	max_occupants_allowed: z
		.number()
		.positive('Max occupants must be a positive number'),
	rent_fee: z.number().positive('Rent fee must be a positive number'),
	rent_fee_currency: z.string().min(1, 'Currency is required'),
	payment_frequency: z.enum(
		['WEEKLY', 'DAILY', 'MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'ANNUALLY'],
		{ error: 'Please select a payment frequency' },
	),
})

type FormSchema = z.infer<typeof ValidationSchema>

const unitTypes = [
	{
		type: 'APARTMENT' as const,
		name: 'Apartment',
		description:
			'Multi-room unit in a shared building, with separate living and sleeping areas.',
		icon: Building2,
	},
	{
		type: 'HOUSE' as const,
		name: 'House',
		description:
			'Standalone building with its own entrance, yard, or compound.',
		icon: Home,
	},
	{
		type: 'STUDIO' as const,
		name: 'Studio',
		description: 'Single open-plan room combining bedroom and living space.',
		icon: LayoutGrid,
	},
	{
		type: 'OFFICE' as const,
		name: 'Office',
		description: 'Workspace for professional or business use, not residential.',
		icon: Briefcase,
	},
	{
		type: 'RETAIL' as const,
		name: 'Retail',
		description: 'Shopfront or commercial space for selling goods or services.',
		icon: Store,
	},
]

const paymentFrequencies: Array<{
	label: string
	value: FormSchema['payment_frequency']
}> = [
	{ label: 'Weekly', value: 'WEEKLY' },
	{ label: 'Daily', value: 'DAILY' },
	{ label: 'Monthly', value: 'MONTHLY' },
	{ label: 'Quarterly', value: 'QUARTERLY' },
	{ label: 'Biannually', value: 'BIANNUALLY' },
	{ label: 'Annually', value: 'ANNUALLY' },
]

export function EditPropertyAssetUnitModule() {
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>(
		'routes/_auth.properties.$propertyId.assets.units.$unitId',
	)
	const unit = loaderData?.unit
	const { clientUserProperty } = useProperty()
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { mutate, isPending } = useUpdatePropertyUnit()

	const property_id = safeString(clientUserProperty?.property?.id)

	const isEditable =
		unit?.status === 'Unit.Status.Draft' ||
		unit?.status === 'Unit.Status.Maintenance'

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			name: '',
			description: '',
			image_url: '',
			features: {},
			type: 'APARTMENT',
			max_occupants_allowed: 1,
			rent_fee: 0,
			rent_fee_currency: 'GHS',
			payment_frequency: 'MONTHLY',
		},
	})

	const {
		upload,
		objectUrl,
		isLoading: isUploading,
	} = useUploadObject('property/images')

	// Reset form when unit data loads
	useEffect(() => {
		if (unit) {
			rhfMethods.reset({
				name: safeString(unit.name),
				description: safeString(unit.description),
				image_url: unit.images?.[0] ? safeString(unit.images[0]) : '',
				features: unit.features ?? {},
				type: unit.type,
				area: unit.area ?? undefined,
				max_occupants_allowed: unit.max_occupants_allowed ?? 1,
				rent_fee: unit.rent_fee,
				rent_fee_currency: unit.rent_fee_currency ?? 'GHS',
				payment_frequency: unit.payment_frequency,
			})
		}
	}, [unit, rhfMethods])

	// Update form when new image is uploaded
	useEffect(() => {
		if (objectUrl) {
			rhfMethods.setValue('image_url', objectUrl, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
	}, [objectUrl, rhfMethods])

	const { watch, formState, setValue } = rhfMethods

	const onSubmit = async (formData: FormSchema) => {
		const dirtyFields = formState.dirtyFields

		mutate(
			{
				id: safeString(unit?.id),
				data: {
					property_id,
					name: dirtyFields.name ? formData.name : undefined,
					description: dirtyFields.description
						? formData.description
						: undefined,
					images:
						dirtyFields.image_url && formData.image_url
							? [formData.image_url]
							: undefined,
					features: dirtyFields.features ? formData.features : undefined,
					type: dirtyFields.type ? formData.type : undefined,
					area: dirtyFields.area ? formData.area : undefined,
					max_occupants_allowed: dirtyFields.max_occupants_allowed
						? formData.max_occupants_allowed
						: undefined,
					rent_fee: dirtyFields.rent_fee ? formData.rent_fee : undefined,
					rent_fee_currency: dirtyFields.rent_fee_currency
						? formData.rent_fee_currency
						: undefined,
					payment_frequency: dirtyFields.payment_frequency
						? formData.payment_frequency
						: undefined,
				},
			},
			{
				onError: () =>
					toast.error('Failed to update property unit. Try again later.'),
				onSuccess: () => {
					toast.success('Property unit has been successfully updated')
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.PROPERTY_UNITS],
					})
					setTimeout(() => {
						void navigate(`/properties/${property_id}/assets/units/${unit?.id}`)
					}, 500)
				},
			},
		)
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={rhfMethods.handleSubmit(onSubmit)}
				className="mx-6 my-6 space-y-10 md:mx-auto md:max-w-2/3"
			>
				{/* Header */}
				<div className="space-y-2">
					<TypographyH2>Edit {unit ? unit.name : 'Unit'}</TypographyH2>
					<TypographyMuted>
						Update the details for this property unit.
					</TypographyMuted>
				</div>

				{!isEditable && (
					<div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
						<Info className="mt-0.5 size-5 shrink-0 text-blue-500" />
						<div>
							<p className="text-sm font-medium text-blue-700">
								Editing is disabled
							</p>
							<p className="text-sm text-blue-600">
								This unit must be in <strong>Draft</strong> or{' '}
								<strong>Maintenance</strong> status to edit. You can change the
								status from the unit detail page.
							</p>
						</div>
					</div>
				)}

				{isEditable && (
					<>
						<hr />

						{/* Type */}
						<div>
							<div className="mb-3 space-y-1">
								<Label>Unit Type</Label>
								<TypographyMuted>
									What kind of space is this unit?
								</TypographyMuted>
							</div>
							<div className="flex flex-col gap-2">
								{unitTypes.map((model) => {
									const isSelected = watch('type') === model.type
									return (
										<button
											key={model.type}
											type="button"
											className={cn(
												'flex items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-zinc-50',
												isSelected && 'border-rose-600 bg-rose-50/50',
											)}
											onClick={() =>
												setValue('type', model.type, {
													shouldDirty: true,
													shouldValidate: true,
												})
											}
										>
											<div
												className={cn(
													'flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100',
													isSelected && 'bg-rose-100',
												)}
											>
												<model.icon
													className={cn(
														'size-5 text-zinc-600',
														isSelected && 'text-rose-600',
													)}
												/>
											</div>
											<div className="min-w-0">
												<p className="text-sm font-medium">{model.name}</p>
												<p className="text-muted-foreground text-sm">
													{model.description}
												</p>
											</div>
										</button>
									)
								})}
							</div>
							{formState.errors?.type && (
								<TypographySmall className="text-destructive mt-2">
									{formState.errors.type.message}
								</TypographySmall>
							)}
						</div>

						<hr />

						{/* Basic Information */}
						<div className="space-y-2">
							<TypographyH2>Basic Information</TypographyH2>
							<TypographyMuted>
								Set the basic information of your unit
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
								label="Unit Image"
								name="image_url"
								validation={{ maxByteSize: 5242880 }}
							/>

							<FormField
								name="description"
								control={rhfMethods.control}
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
						</FieldGroup>

						{/* Unit Specs */}
						<div className="space-y-8">
							<FormField
								name="area"
								control={rhfMethods.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Area (sq m)</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="e.g., 250.50"
												{...field}
												value={field.value ?? ''}
												onChange={(e) =>
													field.onChange(
														e.target.value === ''
															? undefined
															: e.target.valueAsNumber,
													)
												}
											/>
										</FormControl>
										<FormMessage />
										<FormDescription>Optional</FormDescription>
									</FormItem>
								)}
							/>
						</div>

						<hr />

						{/* Rental Information */}
						<div className="space-y-8">
							<div className="space-y-2">
								<TypographyH2>Rental Information</TypographyH2>
								<TypographyMuted>
									Set the rent details for this unit
								</TypographyMuted>
							</div>

							<FormField
								name="max_occupants_allowed"
								control={rhfMethods.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Max Occupants Allowed</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="e.g., 4"
												min={1}
												{...field}
												onChange={(e) => field.onChange(e.target.valueAsNumber)}
											/>
										</FormControl>
										<FormMessage />
										<FormDescription>
											The maximum number of people that can live in this unit at
											the same time.
										</FormDescription>
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-5 gap-4">
								<FormField
									name="rent_fee_currency"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Currency</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl className="w-full">
													<SelectTrigger>
														<SelectValue placeholder="Select" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="GHS">GHS</SelectItem>
													<SelectItem value="USD">USD</SelectItem>
													<SelectItem value="EUR">EUR</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									name="rent_fee"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem className="col-span-4">
											<FormLabel>Rent Fee</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="e.g., 5000.00"
													min={0}
													{...field}
													onChange={(e) =>
														field.onChange(e.target.valueAsNumber)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div>
								<Label>Payment Frequency</Label>
								<div className="mt-3 flex flex-wrap gap-3">
									{paymentFrequencies.map((item) => {
										const isSelected = watch('payment_frequency') === item.value
										return (
											<Button
												key={item.value}
												type="button"
												variant={isSelected ? 'default' : 'outline'}
												className={cn({
													'bg-rose-600 text-white': isSelected,
												})}
												onClick={() =>
													setValue('payment_frequency', item.value, {
														shouldDirty: true,
														shouldValidate: true,
													})
												}
											>
												{item.label}
											</Button>
										)
									})}
								</div>
								<FormDescription className="mt-2">
									How often rent is paid
								</FormDescription>
								{formState.errors?.payment_frequency && (
									<TypographySmall className="text-destructive mt-2">
										{formState.errors.payment_frequency.message}
									</TypographySmall>
								)}
							</div>
						</div>
					</>
				)}

				<hr />

				{/* Actions */}
				<div className="mt-10 flex items-center justify-end space-x-5">
					<Link to={`/properties/${property_id}/assets/units/${unit?.id}`}>
						<Button
							type="button"
							size="sm"
							variant="ghost"
							disabled={isPending}
						>
							<ArrowLeft /> {isEditable ? 'Cancel' : 'Go Back'}
						</Button>
					</Link>
					{isEditable && (
						<Button
							disabled={isPending || !formState.isDirty}
							size="lg"
							variant="default"
							className="bg-rose-600 hover:bg-rose-700"
						>
							{isPending && <Spinner />} Update
						</Button>
					)}
				</div>
			</form>
		</Form>
	)
}
