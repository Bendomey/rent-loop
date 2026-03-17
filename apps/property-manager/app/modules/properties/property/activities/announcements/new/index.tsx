import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Check, ChevronsUpDown, Trash } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
	useLoaderData,
	useNavigate,
	useParams,
	useSearchParams,
} from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	useCreatePropertyAnnouncement,
	useGetPropertyAnnouncement,
	usePublishPropertyAnnouncement,
	useSchedulePropertyAnnouncement,
} from '~/api/announcements'
import { useGetPropertyBlocks } from '~/api/blocks'
import { useGetPropertyUnits } from '~/api/units'
import { DateTimePickerInput } from '~/components/date-time-picker-input'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '~/components/ui/command'
import { FieldGroup } from '~/components/ui/field'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import {
	TypographyH2,
	TypographyH4,
	TypographyMuted,
} from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.activities.announcements.new'

const ValidationSchema = z.object({
	title: z
		.string()
		.min(1, 'Title is required')
		.max(60, 'Title must be 60 characters or less'),
	content: z
		.string()
		.min(1, 'Content is required')
		.max(2000, 'Content must be 2000 characters or less'),
	type: z.enum(['MAINTENANCE', 'COMMUNITY', 'POLICY_CHANGE', 'EMERGENCY'], {
		error: 'Please select a type',
	}),
	priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT'], {
		error: 'Please select a priority',
	}),
	audienceMode: z.enum(['property', 'block', 'units']),
	selectedBlockId: z.string(),
	selectedUnitIds: z.array(z.string()),
})

type FormSchema = z.infer<typeof ValidationSchema>
type SubmitIntent = 'post' | 'draft'

export function NewPropertyAnnouncementModule() {
	const { propertyId } = useParams<{ propertyId: string }>()
	const { clientUserProperty } = useProperty()
	const property = clientUserProperty?.property
	const isMulti = property?.type === 'MULTI'

	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const [searchParams] = useSearchParams()
	const sourceId = searchParams.get('announcement_id') ?? undefined
	const loaderData = useLoaderData<typeof loader>()

	const { data: sourceAnnouncement } = useGetPropertyAnnouncement(
		propertyId,
		sourceId,
		loaderData.sourceAnnouncement ?? undefined,
	)

	const [scheduledAt, setScheduledAt] = useState<Date>(new Date())
	const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)
	const submitIntentRef = useRef<SubmitIntent>('draft')

	const [unitPopoverOpen, setUnitPopoverOpen] = useState(false)

	const { data: blocksData } = useGetPropertyBlocks({
		property_id: propertyId ?? '',
		pagination: { page: 1, per: 100 },
	})
	const { data: unitsData } = useGetPropertyUnits({
		property_id: propertyId ?? '',
		pagination: { page: 1, per: 200 },
	})

	const blocks = blocksData?.rows ?? []
	const units = unitsData?.rows ?? []

	const { mutateAsync: createAnnouncement, isPending: isCreating } =
		useCreatePropertyAnnouncement()
	const { mutateAsync: publishAnnouncement, isPending: isPublishing } =
		usePublishPropertyAnnouncement()
	const { mutateAsync: scheduleAnnouncement, isPending: isScheduling } =
		useSchedulePropertyAnnouncement()

	const isPending = isCreating || isPublishing || isScheduling

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		mode: 'onChange',
		defaultValues: {
			title: '',
			content: '',
			type: 'COMMUNITY',
			priority: 'NORMAL',
			audienceMode: 'property',
			selectedBlockId: '',
			selectedUnitIds: [],
		},
	})

	const { isValid, isDirty } = rhfMethods.formState

	// Pre-populate form when duplicating
	useEffect(() => {
		if (!sourceAnnouncement) return
		const hasBlock = !!sourceAnnouncement.property_block_id
		const hasUnits =
			Array.isArray(sourceAnnouncement.target_unit_ids) &&
			sourceAnnouncement.target_unit_ids.length > 0
		rhfMethods.reset({
			title: `${sourceAnnouncement.title} (Copy)`,
			content: sourceAnnouncement.content,
			type: sourceAnnouncement.type,
			priority: sourceAnnouncement.priority,
			audienceMode: hasUnits ? 'units' : hasBlock ? 'block' : 'property',
			selectedBlockId: sourceAnnouncement.property_block_id ?? '',
			selectedUnitIds: sourceAnnouncement.target_unit_ids ?? [],
		})
		if (sourceAnnouncement.expires_at) {
			setExpiresAt(new Date(sourceAnnouncement.expires_at))
		}
	}, [sourceAnnouncement, rhfMethods])

	const audienceMode = rhfMethods.watch('audienceMode')
	const selectedBlockId = rhfMethods.watch('selectedBlockId')
	const selectedUnitIds = rhfMethods.watch('selectedUnitIds')

	const isScheduled = dayjs(scheduledAt).isAfter(dayjs().add(1, 'minute'))

	const backUrl = `/properties/${propertyId}/activities/announcements`

	const invalidateAndNavigate = () => {
		void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANNOUNCEMENTS] })
		void navigate(backUrl)
	}

	const onSubmit = async (formData: FormSchema) => {
		const intent = submitIntentRef.current

		try {
			const created = await createAnnouncement({
				propertyId: propertyId!,
				title: formData.title,
				content: formData.content,
				type: formData.type,
				priority: formData.priority,
				property_block_id:
					formData.audienceMode === 'block' && formData.selectedBlockId
						? formData.selectedBlockId
						: undefined,
				target_unit_ids:
					formData.audienceMode === 'units' && formData.selectedUnitIds.length
						? formData.selectedUnitIds
						: undefined,
				expires_at: expiresAt ? expiresAt.toISOString() : undefined,
			})

			if (intent === 'draft') {
				toast.success('Announcement saved as draft.')
				invalidateAndNavigate()
				return
			}

			if (!created?.id) return

			if (isScheduled) {
				await scheduleAnnouncement({
					propertyId: propertyId!,
					id: created.id,
					scheduled_at: scheduledAt.toISOString(),
				})
				toast.success('Announcement scheduled.')
			} else {
				await publishAnnouncement({ propertyId: propertyId!, id: created.id })
				toast.success('Announcement published.')
			}

			invalidateAndNavigate()
		} catch {
			toast.error('Something went wrong. Try again later.')
		}
	}

	const toggleUnit = (id: string) => {
		const prev = rhfMethods.getValues('selectedUnitIds')
		rhfMethods.setValue(
			'selectedUnitIds',
			prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
		)
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={rhfMethods.handleSubmit(onSubmit)}
				className="mx-2 max-w-2xl md:mx-auto"
			>
				<div className="mt-10 space-y-1">
					<TypographyH2>Create Announcement</TypographyH2>
				</div>

				<FieldGroup className="mt-10">
					<FormField
						name="title"
						control={rhfMethods.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Title <span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="Announcement title"
										maxLength={60}
									/>
								</FormControl>
								<div className="flex items-center justify-between">
									<FormMessage />
									<FormDescription className="text-xs">
										Maximum of 60 characters.
									</FormDescription>
								</div>
							</FormItem>
						)}
					/>

					<FormField
						name="content"
						control={rhfMethods.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Content <span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="Write your announcement..."
										className="h-60"
										maxLength={2000}
									/>
								</FormControl>
								<div className="flex items-center justify-between">
									<FormMessage />
									<FormDescription className="text-xs">
										{field.value.length
											? `${field.value.length}/2000`
											: 'Max 2,000 characters.'}
									</FormDescription>
								</div>
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-2 gap-4">
						<FormField
							name="type"
							control={rhfMethods.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Type <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="COMMUNITY">Community</SelectItem>
												<SelectItem value="MAINTENANCE">Maintenance</SelectItem>
												<SelectItem value="POLICY_CHANGE">
													Policy Change
												</SelectItem>
												<SelectItem value="EMERGENCY">Emergency</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="priority"
							control={rhfMethods.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Priority <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select priority" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="NORMAL">Normal</SelectItem>
												<SelectItem value="IMPORTANT">Important</SelectItem>
												<SelectItem value="URGENT">Urgent</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* ── Audience ────────────────────────────────────────── */}
					<Separator className="my-2" />

					<div className="space-y-1">
						<TypographyH4>Audience</TypographyH4>
						<TypographyMuted>
							Choose who receives this announcement.
						</TypographyMuted>
					</div>

					<div className="flex flex-col gap-3">
						{/* Entire property */}
						<label className="border-border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-4">
							<Checkbox
								checked={audienceMode === 'property'}
								onCheckedChange={() =>
									rhfMethods.setValue('audienceMode', 'property')
								}
								className="mt-0.5"
							/>
							<div>
								<p className="text-sm font-medium">Entire property</p>
								<p className="text-muted-foreground text-xs">
									All tenants in{' '}
									<span className="font-medium">
										{property?.name ?? 'this property'}
									</span>{' '}
									will be notified.
								</p>
							</div>
						</label>

						{/* Specific block */}
						{isMulti && (
							<label className="border-border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-4">
								<Checkbox
									checked={audienceMode === 'block'}
									onCheckedChange={() => {
										rhfMethods.setValue('audienceMode', 'block')
										rhfMethods.setValue('selectedUnitIds', [])
									}}
									className="mt-0.5"
								/>
								<div className="flex-1 space-y-2">
									<div>
										<p className="text-sm font-medium">Specific block</p>
										<p className="text-muted-foreground text-xs">
											Only tenants in a selected block will be notified.
										</p>
									</div>
									{audienceMode === 'block' && (
										<Select
											value={selectedBlockId}
											onValueChange={(v) =>
												rhfMethods.setValue('selectedBlockId', v)
											}
										>
											<SelectTrigger className="w-full bg-white">
												<SelectValue placeholder="Select a block" />
											</SelectTrigger>
											<SelectContent>
												{blocks.length === 0 && (
													<SelectItem value="_none" disabled>
														No blocks found
													</SelectItem>
												)}
												{blocks.map((block) => (
													<SelectItem key={block.id} value={block.id}>
														{block.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								</div>
							</label>
						)}

						{/* Targeted units — only for MULTI properties */}
						{isMulti && (
							<label className="border-border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-4">
								<Checkbox
									checked={audienceMode === 'units'}
									onCheckedChange={() => {
										rhfMethods.setValue('audienceMode', 'units')
										rhfMethods.setValue('selectedBlockId', '')
									}}
									className="mt-0.5"
								/>
								<div className="flex-1 space-y-2">
									<div>
										<p className="text-sm font-medium">Targeted units</p>
										<p className="text-muted-foreground text-xs">
											Only tenants in the selected units will be notified.
										</p>
									</div>
									{audienceMode === 'units' && (
										<div className="space-y-2">
											<Popover
												open={unitPopoverOpen}
												onOpenChange={setUnitPopoverOpen}
											>
												<PopoverTrigger asChild>
													<Button
														type="button"
														variant="outline"
														className="w-full justify-between font-normal"
													>
														{selectedUnitIds.length > 0
															? `${selectedUnitIds.length} unit${selectedUnitIds.length > 1 ? 's' : ''} selected`
															: 'Select units…'}
														<ChevronsUpDown className="text-muted-foreground ml-2 h-4 w-4 shrink-0" />
													</Button>
												</PopoverTrigger>
												<PopoverContent className="w-72 p-0" align="start">
													<Command>
														<CommandInput placeholder="Search units…" />
														<CommandList>
															<CommandEmpty>No units found.</CommandEmpty>
															<CommandGroup>
																{units.map((unit) => (
																	<CommandItem
																		key={unit.id}
																		value={unit.name}
																		onSelect={() => toggleUnit(unit.id)}
																	>
																		<Check
																			className={cn(
																				'mr-2 h-4 w-4',
																				selectedUnitIds.includes(unit.id)
																					? 'opacity-100'
																					: 'opacity-0',
																			)}
																		/>
																		{unit.name}
																	</CommandItem>
																))}
															</CommandGroup>
														</CommandList>
													</Command>
												</PopoverContent>
											</Popover>

											{selectedUnitIds.length > 0 && (
												<div className="flex flex-wrap gap-1.5">
													{selectedUnitIds.map((id) => {
														const unit = units.find((u) => u.id === id)
														return (
															<span
																key={id}
																className="text-muted-foreground inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-xs"
															>
																{unit?.name ?? id}
																<button
																	type="button"
																	onClick={() => toggleUnit(id)}
																	className="hover:text-foreground ml-0.5"
																>
																	×
																</button>
															</span>
														)
													})}
												</div>
											)}
										</div>
									)}
								</div>
							</label>
						)}
					</div>

					{/* ── Schedule ─────────────────────────────────────────── */}
					<Separator className="my-2" />

					<div className="space-y-1">
						<TypographyH4>Post Now or Schedule for Later</TypographyH4>
						<TypographyMuted>
							Your tenants will be notified when your announcement is published.
						</TypographyMuted>
					</div>

					<div className="grid grid-cols-1 gap-4">
						<div className="flex flex-col gap-2">
							<Label>Start date &amp; time</Label>
							<DateTimePickerInput
								value={scheduledAt}
								onChange={(date) => setScheduledAt(date ?? new Date())}
								minDate={new Date()}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label>
								End date &amp; time{' '}
								<span className="text-muted-foreground font-normal">
									(optional)
								</span>
							</Label>
							<DateTimePickerInput
								value={expiresAt}
								onChange={setExpiresAt}
								placeholder="No expiry"
								minDate={scheduledAt}
							/>
						</div>
					</div>
				</FieldGroup>

				<Separator className="my-8" />

				<div className="flex items-center justify-between pb-10">
					<div className="space-x-2">
						<Button
							type="submit"
							size="lg"
							disabled={isPending || !isValid}
							className="bg-rose-600 hover:bg-rose-700"
							onClick={() => {
								submitIntentRef.current = 'post'
							}}
						>
							{(isCreating || isPublishing || isScheduling) && <Spinner />}
							{isScheduled ? 'Schedule Post' : 'Post Now'}
						</Button>
						<Button
							type="submit"
							size="lg"
							variant="secondary"
							disabled={isPending || !isValid}
							onClick={() => {
								submitIntentRef.current = 'draft'
							}}
						>
							{isCreating && submitIntentRef.current === 'draft' && <Spinner />}
							Save As Draft
						</Button>
					</div>

					<Button
						type="button"
						size="lg"
						variant="ghost"
						disabled={!isDirty}
						className="text-red-600 hover:bg-red-50 hover:text-red-600 dark:text-red-600 dark:hover:bg-red-900/10"
						onClick={() => void navigate(backUrl)}
					>
						<Trash className="size-4" />
						Discard
					</Button>
				</div>
			</form>
		</Form>
	)
}
