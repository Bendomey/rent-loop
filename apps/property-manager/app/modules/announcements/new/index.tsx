import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Info, Trash } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	useCreateAnnouncement,
	useGetAnnouncement,
	usePublishAnnouncement,
	useScheduleAnnouncement,
} from '~/api/announcements'
import { DateTimePickerInput } from '~/components/date-time-picker-input'
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
import { Input } from '~/components/ui/input'
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
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth._dashboard.activities.announcements.new._index'

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
})

type FormSchema = z.infer<typeof ValidationSchema>
type SubmitIntent = 'post' | 'draft'

export function NewAnnouncementModule() {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const [searchParams] = useSearchParams()
	const announcementId = safeString(searchParams.get('announcement_id'))
	const loaderData = useLoaderData<typeof loader>()

	const [scheduledAt, setScheduledAt] = useState<Date>(new Date())
	const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)
	const submitIntentRef = useRef<SubmitIntent>('draft')

	const { mutateAsync: createAnnouncement, isPending: isCreating } =
		useCreateAnnouncement()
	const { mutateAsync: publishAnnouncement, isPending: isPublishing } =
		usePublishAnnouncement()
	const { mutateAsync: scheduleAnnouncement, isPending: isScheduling } =
		useScheduleAnnouncement()

	const isPending = isCreating || isPublishing || isScheduling

	const { data: sourceAnnouncement } = useGetAnnouncement(
		clientId,
		announcementId,
		loaderData.sourceAnnouncement ?? undefined,
	)

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		mode: 'onChange',
		defaultValues: {
			title: '',
			content: '',
			type: 'COMMUNITY',
			priority: 'NORMAL',
		},
	})

	const { isValid, isDirty } = rhfMethods.formState

	// Derived: is the start date/time in the future?
	const isScheduled = dayjs(scheduledAt).isAfter(dayjs().add(1, 'minute'))

	// Pre-populate form when duplicating
	useEffect(() => {
		if (!sourceAnnouncement) return
		rhfMethods.reset({
			title: `${sourceAnnouncement.title} (Copy)`,
			content: sourceAnnouncement.content,
			type: sourceAnnouncement.type,
			priority: sourceAnnouncement.priority,
		})
		if (sourceAnnouncement.expires_at) {
			setExpiresAt(new Date(sourceAnnouncement.expires_at))
		}
	}, [sourceAnnouncement, rhfMethods])

	const invalidateAndNavigate = () => {
		void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANNOUNCEMENTS] })
		void navigate('/activities/announcements')
	}

	const onSubmit = async (formData: FormSchema) => {
		const intent = submitIntentRef.current

		try {
			const created = await createAnnouncement({
				clientId,
				title: formData.title,
				content: formData.content,
				type: formData.type,
				priority: formData.priority,
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
					clientId,
					id: created.id,
					scheduled_at: scheduledAt.toISOString(),
				})
				toast.success('Announcement scheduled.')
			} else {
				await publishAnnouncement({ clientId, id: created.id })
				toast.success('Announcement published.')
			}

			invalidateAndNavigate()
		} catch {
			toast.error('Something went wrong. Try again later.')
		}
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

					<Separator className="my-2" />

					<div className="space-y-1">
						<TypographyH4>Audience</TypographyH4>
					</div>

					<div className="bg-muted/50 border-border flex items-start gap-3 rounded-lg border p-4">
						<Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
						<p className="text-muted-foreground text-sm">
							This announcement will be broadcast to{' '}
							<span className="text-foreground font-medium">all tenants</span>{' '}
							across all your properties.
						</p>
					</div>

					<Separator className="my-2" />

					<div className="space-y-1">
						<TypographyH4>Post Now or Schedule for Later</TypographyH4>
						<TypographyMuted>
							Your tenants will be notified when your announcement is published.
						</TypographyMuted>
					</div>

					<div className="grid grid-cols-1 gap-4">
						<div className="flex flex-col gap-2">
							<FormLabel>Start date &amp; time</FormLabel>
							<DateTimePickerInput
								value={scheduledAt}
								onChange={(date) => setScheduledAt(date ?? new Date())}
								minDate={new Date()}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<FormLabel>
								End date &amp; time{' '}
								<span className="text-muted-foreground font-normal">
									(optional)
								</span>
							</FormLabel>
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
						onClick={() => void navigate('/activities/announcements')}
					>
						<Trash className="size-4" />
						Discard
					</Button>
				</div>
			</form>
		</Form>
	)
}
