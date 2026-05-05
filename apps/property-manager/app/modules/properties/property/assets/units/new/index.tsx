import { zodResolver } from '@hookform/resolvers/zod'
import {
	ArrowLeft,
	Briefcase,
	Building2,
	Home,
	Info,
	LayoutGrid,
	Minus,
	Plus,
	Store,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useFetcher, useLoaderData } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { BlockNavigationDialog } from '~/components/block-navigation-dialog'
import { FeatureInput } from '~/components/feature'
import { PropertyTagInput } from '~/components/property-tag'
import { BlockSelect } from '~/components/SingleSelect/block-select'
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
import { ImageUploadBulk } from '~/components/ui/image-upload-bulk'
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
import { useNavigationBlocker } from '~/hooks/use-navigation-blocker'
import { ASSET_MANAGEMENT_GUIDE_URL } from '~/lib/constants'
import { convertPesewasToCedis } from '~/lib/format-amount'
import { sanitizeFilename, safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import type { loader } from '~/routes/_auth.properties.$propertyId.assets.units.new'

const ValidationSchema = z.object({
	property_block_id: z
		.string()
		.optional()
		.refine(Boolean, { message: 'Please select a block' }),
	block: z.string(),
	type: z.enum(['APARTMENT', 'HOUSE', 'STUDIO', 'OFFICE', 'RETAIL'], {
		error: 'Please select a type',
	}),
	status: z.enum(
		[
			'Unit.Status.Draft',
			'Unit.Status.Available',
			'Unit.Status.Occupied',
			'Unit.Status.PartiallyOccupied',
			'Unit.Status.Maintenance',
		],
		{ error: 'Please select a status' },
	),
	name: z
		.string({ error: 'Name is required' })
		.min(2, 'Please enter a valid name'),
	images: z.array(z.string()).optional(),
	description: z
		.string()
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	tags: z.array(z.string().min(1)).optional(),
	features: z.record(z.string(), z.string()).optional(),
	area: z.number().positive('Area must be a positive number').optional(),
	max_occupants_allowed: z
		.number()
		.positive('Max occupants must be a positive number'),
	rent_fee: z.number().positive('Rent fee must be a positive number'),
	rent_fee_currency: z.string().min(1, 'Currency is required'),
	payment_frequency: z.enum(
		['DAILY', 'WEEKLY', 'MONTHLY'], // 'QUARTERLY', 'BIANNUALLY', 'ANNUALLY'
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

const statuses: Array<{ label: string; value: PropertyUnit['status'] }> = [
	{ label: 'Draft', value: 'Unit.Status.Draft' },
	{ label: 'Available', value: 'Unit.Status.Available' },
	{ label: 'Maintenance', value: 'Unit.Status.Maintenance' },
]

export function NewPropertyAssetUnitsModule() {
	const { clientUserProperty, sourceUnit } = useLoaderData<typeof loader>()
	const property_id = safeString(clientUserProperty?.property?.id)

	const modes = clientUserProperty?.property?.modes ?? []
	const isLease = modes.includes('LEASE')

	const paymentFrequencies: Array<{
		label: string
		value: FormSchema['payment_frequency']
	}> = [
		{ label: 'Daily', value: 'DAILY' },
		...(isLease
			? [
					{ label: 'Weekly', value: 'WEEKLY' as const },
					{ label: 'Monthly', value: 'MONTHLY' as const },
				]
			: []),
	]

	const rentFeeLabels: Record<FormSchema['payment_frequency'], string> = {
		DAILY: 'Price per Day',
		WEEKLY: 'Price per Week',
		MONTHLY: 'Price per Month',
	}

	const createFetcher = useFetcher<{ error: string }>()

	const isSubmitting = createFetcher.state !== 'idle'

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			status: 'Unit.Status.Draft',
			type: 'APARTMENT',
			name: '',
			description: '',
			images: [],
			features: {},
			tags: [],
			max_occupants_allowed: 1,
			rent_fee: 0,
			rent_fee_currency: 'GHS',
			payment_frequency: isLease ? 'MONTHLY' : 'DAILY',
		},
	})

	const [uploadingIds, setUploadingIds] = useState<string[]>([])
	const [imageUrlMap, setImageUrlMap] = useState<Record<string, string>>({})

	const uploadImage = async (imageId: string, file: File) => {
		setUploadingIds((prev) => [...prev, imageId])
		try {
			const fd = new FormData()
			fd.append('file', file)
			fd.append(
				'objectKey',
				`property/images/${new Date().toISOString()}-${sanitizeFilename(file.name)}`,
			)
			const res = await fetch('/api/r2/upload', { method: 'POST', body: fd })
			const data = (await res.json()) as { url?: string; error?: string }
			if (data.url) {
				setImageUrlMap((prev) => ({ ...prev, [imageId]: data.url! }))
				rhfMethods.setValue(
					'images',
					[...(rhfMethods.getValues('images') ?? []), data.url!],
					{ shouldDirty: true },
				)
			} else {
				toast.error('Failed to upload image')
			}
		} catch {
			toast.error('Failed to upload image')
		} finally {
			setUploadingIds((prev) => prev.filter((id) => id !== imageId))
		}
	}

	useEffect(() => {
		if (!sourceUnit) return
		rhfMethods.reset({
			status: 'Unit.Status.Draft',
			type: sourceUnit.type,
			name: `${sourceUnit.name} (copy)`,
			description: sourceUnit.description ?? '',
			images: sourceUnit.images ?? [],
			features: sourceUnit.features ?? {},
			tags: [],
			area: sourceUnit.area ?? undefined,
			max_occupants_allowed: sourceUnit.max_occupants_allowed ?? 1,
			rent_fee: convertPesewasToCedis(sourceUnit.rent_fee),
			rent_fee_currency: sourceUnit.rent_fee_currency,
			payment_frequency: sourceUnit.payment_frequency,
			property_block_id: sourceUnit.property_block_id,
			block: sourceUnit.property_block?.name ?? '',
		})
	}, [sourceUnit, rhfMethods])

	useEffect(() => {
		if (createFetcher?.data?.error) {
			toast.error('Failed to create unit. Please try again.')
		}
	}, [createFetcher?.data])

	const { watch, formState, setValue } = rhfMethods

	const isDirty = formState.isDirty
	const blocker = useNavigationBlocker(isSubmitting ? false : isDirty)

	const onSubmit = (formData: FormSchema) => {
		const submitData = new FormData()
		submitData.set('property_id', property_id)
		submitData.set('property_block_id', formData.property_block_id ?? '')
		submitData.set('type', formData.type)
		submitData.set('status', formData.status)
		submitData.set('name', formData.name)
		if (formData.description)
			submitData.set('description', formData.description)
		if (formData.images) {
			for (const url of formData.images) {
				submitData.append('images', url)
			}
		}
		if (formData.tags) {
			for (const tag of formData.tags) {
				submitData.append('tags', tag)
			}
		}
		if (formData.features) {
			for (const [key, value] of Object.entries(formData.features)) {
				submitData.append('features', `${key}:${value}`)
			}
		}
		submitData.set(
			'max_occupants_allowed',
			String(formData.max_occupants_allowed),
		)
		if (formData.area) submitData.set('area', String(formData.area))
		submitData.set('rent_fee', String(formData.rent_fee))
		submitData.set('rent_fee_currency', formData.rent_fee_currency)
		submitData.set('payment_frequency', formData.payment_frequency)

		void createFetcher.submit(submitData, {
			method: 'POST',
			action: `/properties/${property_id}/assets/units/new`,
		})
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={rhfMethods.handleSubmit(onSubmit)}
				className="mx-6 my-6 space-y-10 md:mx-auto md:max-w-2/3"
			>
				{/* Header */}
				<div className="space-y-2">
					<TypographyH2>
						{sourceUnit ? 'Duplicate Unit' : 'Add New Property Unit'}
					</TypographyH2>
					<TypographyMuted>
						{sourceUnit
							? 'Review and adjust the copied details, then save to create the new unit.'
							: 'We break down properties into units to better organize and manage rental spaces.'}
					</TypographyMuted>
				</div>

				<hr />

				{/* Block Select */}
				<div>
					<BlockSelect
						property_id={property_id}
						value={watch('property_block_id')}
						onChange={({ id, name }) => {
							setValue('property_block_id', id, {
								shouldDirty: true,
								shouldValidate: true,
							})
							setValue('block', name)
						}}
					/>
					{formState.errors?.property_block_id && (
						<TypographySmall className="text-destructive mt-2">
							{formState.errors.property_block_id.message}
						</TypographySmall>
					)}
				</div>

				{/* Unit Type */}
				<div>
					<div className="mb-3 space-y-1">
						<Label>Unit Type</Label>
						<TypographyMuted>What kind of space is this unit?</TypographyMuted>
						<p className="text-muted-foreground text-xs">
							<a
								href={`${ASSET_MANAGEMENT_GUIDE_URL}#what-are-units`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-rose-600 hover:underline"
							>
								See how unit types work
							</a>
						</p>
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

				{/* Status */}
				<div>
					<Label>Status</Label>
					<div className="mt-3 flex flex-wrap gap-3">
						{statuses.map((item) => {
							const isSelected = watch('status') === item.value
							return (
								<Button
									type="button"
									key={item.value}
									variant={isSelected ? 'default' : 'outline'}
									className={cn({
										'bg-rose-600 text-white': isSelected,
									})}
									onClick={() =>
										setValue('status', item.value, {
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
					{formState.errors?.status && (
						<TypographySmall className="text-destructive mt-2">
							{formState.errors.status.message}
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

					<ImageUploadBulk
						key={sourceUnit?.id}
						label="Unit Images"
						hint="First image will be used as the main photo"
						acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
						validation={{ maxByteSize: 5242880 }}
						uploadingIds={uploadingIds}
						imageSources={(sourceUnit?.images ?? []).map((url, i) => ({
							id: `prefill-${i}`,
							src: url,
						}))}
						onImageAdded={(image) => {
							if (image.file) void uploadImage(image.id, image.file)
						}}
						onRemove={(image) => {
							const url = imageUrlMap[image.id] ?? image.src
							rhfMethods.setValue(
								'images',
								(rhfMethods.getValues('images') ?? []).filter((u) => u !== url),
								{ shouldDirty: true },
							)
							setImageUrlMap(({ [image.id]: _, ...rest }) => rest)
						}}
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
					<PropertyTagInput />
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
									<div className="flex items-center gap-3">
										<Button
											type="button"
											variant="outline"
											size="icon"
											disabled={field.value <= 1}
											onClick={() => field.onChange(field.value - 1)}
										>
											<Minus className="size-4" />
										</Button>
										<span className="w-8 text-center text-sm font-medium">
											{field.value}
										</span>
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() => field.onChange(field.value + 1)}
										>
											<Plus className="size-4" />
										</Button>
									</div>
								</FormControl>
								<FormMessage />
								<div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
									<Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
									<p className="text-sm text-blue-700 dark:text-blue-300">
										Increase this when you want to rent this unit to multiple
										tenants at the same time — for example, renting individual
										rooms in a shared apartment. The default is 1 (single tenant
										only).
									</p>
								</div>
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
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl className="w-full">
											<SelectTrigger>
												<SelectValue placeholder="Select" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="GHS">GHS</SelectItem>
											{/* <SelectItem value="USD">USD</SelectItem>
											<SelectItem value="EUR">EUR</SelectItem> */}
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
									<FormLabel>
										{rentFeeLabels[watch('payment_frequency')]}
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											step="0.01"
											placeholder="e.g., 5000.00"
											min={0}
											{...field}
											onChange={(e) => field.onChange(e.target.valueAsNumber)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div>
						<Label>Billing Cycle</Label>
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
							How the unit is rented — the price above is charged per cycle
						</FormDescription>
						{formState.errors?.payment_frequency && (
							<TypographySmall className="text-destructive mt-2">
								{formState.errors.payment_frequency.message}
							</TypographySmall>
						)}
					</div>
				</div>

				<hr />

				{/* Actions */}
				<div className="mt-10 flex items-center justify-end space-x-5">
					<Link to={`/properties/${property_id}/assets/units`}>
						<Button
							type="button"
							size="sm"
							variant="ghost"
							disabled={isSubmitting}
						>
							<ArrowLeft /> Cancel
						</Button>
					</Link>
					<Button
						disabled={isSubmitting || uploadingIds.length > 0}
						size="lg"
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						{isSubmitting && <Spinner />} Create Unit
					</Button>
				</div>
			</form>

			<BlockNavigationDialog blocker={blocker} />
		</Form>
	)
}
