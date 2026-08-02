import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
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
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { TypographyH3, TypographyMuted } from '~/components/ui/typography'
import { useUploadObjectBulk } from '~/hooks/use-upload-object-bulk'
import { QUERY_KEYS } from '~/lib/constants'
import { CATEGORY_LABELS } from '~/lib/maintenance-request.utils'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as [
	MaintenanceRequestCategory,
	...MaintenanceRequestCategory[],
]

const schema = z
	.object({
		title: z.string().min(1, 'Title is required'),
		description: z.string().min(1, 'Description is required'),
		priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'], {
			error: 'Priority is required',
		}),
		category: z.enum(CATEGORY_VALUES, {
			error: 'Category is required',
		}),
		unit_ids: z.array(z.string()),
		block_ids: z.array(z.string()),
		create_separate_requests: z.boolean(),
		visibility: z.enum(['TENANT_VISIBLE', 'INTERNAL_ONLY']),
		attachments: z.array(z.string()).optional(),
	})
	.superRefine((values, ctx) => {
		// A request must concern something. Reported on unit_ids so the message
		// lands next to the units picker.
		if (values.unit_ids.length === 0 && values.block_ids.length === 0) {
			ctx.addIssue({
				code: 'custom',
				path: ['unit_ids'],
				message: 'Select at least one block or unit',
			})
		}
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
			unit_ids: [],
			block_ids: [],
			create_separate_requests: false,
			visibility: 'TENANT_VISIBLE',
			attachments: [],
		},
	})

	const selectedUnitIds = form.watch('unit_ids')
	const selectedBlockIds = form.watch('block_ids')
	const fanOut = form.watch('create_separate_requests')

	const assetCount = selectedUnitIds.length + selectedBlockIds.length

	// With fan-out on, each unit becomes its own single-unit request and may stay
	// tenant-visible; block requests are always internal. With fan-out off,
	// anything broader than one unit is internal.
	const forcedInternal = fanOut
		? selectedUnitIds.length === 0
		: selectedBlockIds.length > 0 || assetCount > 1

	const blockOptions = (blocks?.rows ?? []).map((block) => ({
		label: block.name,
		value: block.id,
	}))

	// Units are grouped by their block so a large property stays scannable.
	const unitGroups = (blocks?.rows ?? [])
		.map((block) => ({
			heading: block.name,
			options: (units?.rows ?? [])
				.filter((unit) => unit.property_block_id === block.id)
				.map((unit) => ({ label: unit.name, value: unit.id })),
		}))
		.filter((group) => group.options.length > 0)

	useEffect(() => {
		form.setValue('attachments', uploadedUrls)
	}, [uploadedUrls, form])

	useEffect(() => {
		if (forcedInternal) {
			form.setValue('visibility', 'INTERNAL_ONLY')
		}
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
				unit_ids: values.unit_ids,
				block_ids: values.block_ids,
				create_separate_requests: values.create_separate_requests,
				property_id: resolvedPropertyId,
				attachments: values.attachments ?? [],
			}
			const created = await createRequest.mutateAsync(input)

			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS],
			})

			const listPath = `/properties/${resolvedPropertyId}/activities/maintenance-requests`

			// A single request goes straight to its detail page; a fan-out has no
			// single destination, so land on the board instead.
			const onlyRequest = created?.length === 1 ? created[0] : undefined
			if (onlyRequest) {
				toast.success('Maintenance request created')
				void navigate(`${listPath}/${onlyRequest.id}`)
				return
			}

			toast.success(`${created?.length ?? 0} maintenance requests created`)
			void navigate(listPath)
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
							name="block_ids"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Blocks</FormLabel>
									<FormControl>
										<MultiSelect
											options={blockOptions}
											defaultValue={field.value}
											onValueChange={field.onChange}
											placeholder="Select blocks"
											maxCount={3}
											className="w-full"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="unit_ids"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Units</FormLabel>
									<FormControl>
										<MultiSelect
											options={unitGroups}
											defaultValue={field.value}
											onValueChange={field.onChange}
											placeholder="Select units"
											maxCount={3}
											className="w-full"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{assetCount > 1 && (
						<FormField
							control={form.control}
							name="create_separate_requests"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start gap-3 rounded-md border p-4">
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1">
										<FormLabel>Create separate requests</FormLabel>
										<TypographyMuted>
											Creates one request per selected asset. Each unit request
											can still notify its tenant.
										</TypographyMuted>
									</div>
								</FormItem>
							)}
						/>
					)}

					{forcedInternal && (
						<div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
							<TypographyMuted className="text-amber-700 dark:text-amber-400">
								{selectedUnitIds.length === 0
									? 'Block work has no tenant attached, so this request will be Internal Only.'
									: 'This request covers more than one asset, so it will be Internal Only and no tenant is notified. Turn on “Create separate requests” to notify each tenant.'}
							</TypographyMuted>
						</div>
					)}
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
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={forcedInternal}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select visibility" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="TENANT_VISIBLE">
												Visible for Tenant
											</SelectItem>
											<SelectItem value="INTERNAL_ONLY">
												Internal Only
											</SelectItem>
										</SelectContent>
									</Select>
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
