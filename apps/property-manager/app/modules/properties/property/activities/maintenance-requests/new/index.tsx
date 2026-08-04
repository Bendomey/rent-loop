import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useGetPropertyBlocks } from '~/api/blocks'
import {
	useCreateMaintenanceRequest,
	type CreateMaintenanceRequestInput,
} from '~/api/maintenance-requests'
import { useGetPropertyUnits } from '~/api/units'
import { MultiSelect } from '~/components/multi-select'
import { Button } from '~/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { ImageUploadBulk } from '~/components/ui/image-upload-bulk'
import { Input } from '~/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { TypographyH3, TypographyMuted } from '~/components/ui/typography'
import { useUploadObjectBulk } from '~/hooks/use-upload-object-bulk'
import { QUERY_KEYS } from '~/lib/constants'
import { CATEGORY_LABELS } from '~/lib/maintenance-request.utils'
import { getPropertyUnitStatusLabel } from '~/lib/properties.utils'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as [
	MaintenanceRequestCategory,
	...MaintenanceRequestCategory[],
]

// The pickers live in their own object so this rule keeps running even when
// sibling fields are still empty — an object-level refinement is skipped once a
// field like priority fails, which would hide the message on the first submit.
const assetsSchema = z
	.object({
		block_ids: z.array(z.string()),
		unit_ids: z.array(z.string()),
	})
	.superRefine((assets, ctx) => {
		// A request must concern something. Reported on both pickers so whichever
		// one the user is looking at carries the message.
		if (assets.unit_ids.length > 0 || assets.block_ids.length > 0) return

		for (const path of ['block_ids', 'unit_ids'] as const) {
			ctx.addIssue({
				code: 'custom',
				path: [path],
				message: 'Select at least one block or unit',
			})
		}
	})

const VISIBILITY_LABELS = {
	TENANT_VISIBLE: 'Visible for Tenant',
	INTERNAL_ONLY: 'Internal Only',
} as const

const VISIBILITY_VALUES = Object.keys(VISIBILITY_LABELS) as [
	keyof typeof VISIBILITY_LABELS,
	...Array<keyof typeof VISIBILITY_LABELS>,
]

const schema = z.object({
	title: z.string('Title is required').min(1, 'Title is required'),
	description: z.string().min(1, 'Description is required'),
	priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'], {
		error: 'Priority is required',
	}),
	category: z.enum(CATEGORY_VALUES, {
		error: 'Category is required',
	}),
	assets: assetsSchema,
	visibility: z.enum(VISIBILITY_VALUES),
	attachments: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof schema>

export function NewPropertyActivitiesMaintenanceRequestModule() {
	const { propertyId } = useParams()
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const createRequest = useCreateMaintenanceRequest()

	const resolvedPropertyId = safeString(
		propertyId ?? clientUserProperty?.property?.id,
	)

	const { data: units } = useGetPropertyUnits(
		safeString(clientUser?.client_id),
		{
			property_id: resolvedPropertyId,
			pagination: { page: 1, per: 200 },
		},
	)

	const { data: blocks } = useGetPropertyBlocks(
		safeString(clientUser?.client_id),
		{
			property_id: resolvedPropertyId,
			pagination: { page: 1, per: 200 },
		},
	)

	const { upload, remove, uploadingIds, uploadedUrls, isUploading } =
		useUploadObjectBulk('maintenance-requests')

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			title: '',
			description: '',
			priority: undefined,
			category: undefined,
			assets: { block_ids: [], unit_ids: [] },
			visibility: 'TENANT_VISIBLE',
			attachments: [],
		},
	})

	const selectedUnitIds = form.watch('assets.unit_ids')
	const selectedBlockIds = form.watch('assets.block_ids')

	// Both pickers share one rule, so revalidate the pair whenever either
	// changes — otherwise the message lingers on the picker left untouched.
	const revalidateAssets = () =>
		void form.trigger(['assets.block_ids', 'assets.unit_ids'])

	const assetCount = selectedUnitIds.length + selectedBlockIds.length

	// RENTL-48.3 AC#3: a block, or more than one asset, forces the request
	// internal-only and locks the control — there is no single tenant behind
	// such a request to show it to.
	const forcedInternal = selectedBlockIds.length > 0 || assetCount > 1

	const forcedInternalReason =
		selectedUnitIds.length === 0
			? 'Block work has no tenant attached, so this request stays Internal Only.'
			: 'This request covers more than one asset, so it stays Internal Only and no tenant is notified.'

	const blockOptions = (blocks?.rows ?? []).map((block) => ({
		label: block.name,
		value: block.id,
		description: safeString(block.description) || undefined,
		meta: `${block.units_count}`,
	}))

	// Units are grouped by their block so a large property stays scannable. The
	// grouping is presentation only — picking a block never narrows this list,
	// the two fields are independent selections.
	const unitGroups = (blocks?.rows ?? [])
		.map((block) => ({
			heading: block.name,
			options: (units?.rows ?? [])
				.filter((unit) => unit.property_block_id === block.id)
				.map((unit) => ({
					label: unit.name,
					value: unit.id,
					description: getPropertyUnitStatusLabel(unit.status),
				})),
		}))
		.filter((group) => group.options.length > 0)

	useEffect(() => {
		form.setValue('attachments', uploadedUrls)
	}, [uploadedUrls, form])

	// The lock overwrites whatever was chosen, so remember the manual pick and
	// hand it back once the selection no longer forces internal-only —
	// otherwise the field stays stuck on Internal Only after the cause is gone.
	const chosenVisibility = useRef<FormValues['visibility']>('TENANT_VISIBLE')

	useEffect(() => {
		form.setValue(
			'visibility',
			forcedInternal ? 'INTERNAL_ONLY' : chosenVisibility.current,
		)
	}, [forcedInternal, form])

	const onSubmit = async (values: FormValues) => {
		try {
			const input: CreateMaintenanceRequestInput = {
				client_id: safeString(clientUser?.client_id),
				title: values.title,
				description: values.description,
				priority: values.priority,
				category: values.category,
				visibility: values.visibility,
				unit_ids: values.assets.unit_ids,
				block_ids: values.assets.block_ids,
				property_id: resolvedPropertyId,
				attachments: values.attachments ?? [],
			}
			const created = await createRequest.mutateAsync(input)

			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS],
			})

			const listPath = `/properties/${resolvedPropertyId}/activities/maintenance-requests`

			toast.success('Maintenance request created')

			// The API answers with a list, but a combined request is always the one
			// record; fall back to the board if it ever comes back empty.
			const createdRequest = created?.[0]
			void navigate(
				createdRequest ? `${listPath}/${createdRequest.id}` : listPath,
			)
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to create request',
			)
		}
	}

	return (
		<div className="mx-4 my-6 flex flex-col gap-6 md:mx-auto md:max-w-xl">
			<div>
				<TypographyH3>New Maintenance Request</TypographyH3>
				<TypographyMuted>
					Report a new maintenance issue for one or more blocks or units.
				</TypographyMuted>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FormField
							control={form.control}
							name="assets.block_ids"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormControl>
										<MultiSelect
											label="Blocks"
											options={blockOptions}
											defaultValue={field.value}
											onValueChange={(value) => {
												field.onChange(value)
												revalidateAssets()
											}}
											placeholder="Select blocks"
											emptyHint="No block on this property matches that name."
											invalid={Boolean(fieldState.error)}
											className="w-full"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="assets.unit_ids"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormControl>
										<MultiSelect
											label="Units"
											options={unitGroups}
											defaultValue={field.value}
											onValueChange={(value) => {
												field.onChange(value)
												revalidateAssets()
											}}
											placeholder="Select units"
											emptyHint="No unit on this property matches that name."
											invalid={Boolean(fieldState.error)}
											className="w-full"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Title <span className="text-red-600">*</span>
								</FormLabel>
								<FormControl>
									<Input placeholder="e.g. Fix leaky faucet" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Description <span className="text-red-600">*</span>
								</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Describe the issue in detail..."
										rows={4}
										className="h-60"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FormField
							control={form.control}
							name="priority"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Priority <span className="text-red-600">*</span>
									</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select priority" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="LOW">Low</SelectItem>
											<SelectItem value="MEDIUM">Medium</SelectItem>
											<SelectItem value="HIGH">High</SelectItem>
											<SelectItem value="EMERGENCY">Emergency</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="category"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Category <span className="text-red-600">*</span>
									</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select category" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{CATEGORY_VALUES.map((category) => (
												<SelectItem key={category} value={category}>
													{CATEGORY_LABELS[category]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="mt-10">
						<TypographyH3>Add Attachments</TypographyH3>
						<TypographyMuted>
							You can add photos related to the maintenance issue.
						</TypographyMuted>
					</div>

					<ImageUploadBulk
						hint="Optional"
						disabled={createRequest.isPending}
						uploadingIds={uploadingIds}
						onImageAdded={(image) => {
							if (image.file) void upload(image.id, image.file)
						}}
						onRemove={(image) => remove(image.id)}
					/>

					<div className="mt-10">
						<TypographyH3 className="text-gray-400">
							Optional: Visibility
						</TypographyH3>
						<TypographyMuted>
							Should the tenant be able to see this maintenance request in their
							portal?
						</TypographyMuted>
					</div>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FormField
							control={form.control}
							name="visibility"
							render={({ field }) => (
								<FormItem>
									{/* The wrapper is always rendered: swapping it in and out
									would remount the Select, and a freshly mounted one shows
									no text until its items have registered. A disabled
									trigger takes no pointer events, so the wrapper — not the
									trigger — is what the tooltip hangs off. */}
									<Tooltip>
										<TooltipTrigger asChild>
											<span
												tabIndex={forcedInternal ? 0 : -1}
												className="block"
											>
												<Select
													onValueChange={(value) => {
														chosenVisibility.current =
															value as FormValues['visibility']
														field.onChange(value)
													}}
													value={field.value}
													disabled={forcedInternal}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															{/* Explicit children so the label never depends
															on whether the items have mounted. */}
															<SelectValue placeholder="Select visibility">
																{VISIBILITY_LABELS[field.value]}
															</SelectValue>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{VISIBILITY_VALUES.map((value) => (
															<SelectItem key={value} value={value}>
																{VISIBILITY_LABELS[value]}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</span>
										</TooltipTrigger>
										{forcedInternal && (
											<TooltipContent className="max-w-xs">
												{forcedInternalReason}
											</TooltipContent>
										)}
									</Tooltip>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="flex items-center gap-3 pt-2 pb-10">
						<Button
							type="submit"
							disabled={createRequest.isPending || isUploading}
						>
							{createRequest.isPending ? 'Creating...' : 'Create Request'}
						</Button>
						<Button
							type="button"
							variant="outline"
							asChild
							disabled={createRequest.isPending}
						>
							<Link
								to={`/properties/${resolvedPropertyId}/activities/maintenance-requests`}
							>
								Cancel
							</Link>
						</Button>
					</div>
				</form>
			</Form>
		</div>
	)
}
