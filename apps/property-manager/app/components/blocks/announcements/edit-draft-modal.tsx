import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	useUpdateAnnouncement,
	useUpdatePropertyAnnouncement,
} from '~/api/announcements'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
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
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

const ValidationSchema = z.object({
	title: z
		.string()
		.min(1, 'Title is required')
		.max(60, 'Maximum 60 characters'),
	content: z
		.string()
		.min(1, 'Content is required')
		.max(2000, 'Maximum 2000 characters'),
	type: z.enum(['MAINTENANCE', 'COMMUNITY', 'POLICY_CHANGE', 'EMERGENCY'], {
		error: 'Please select a type',
	}),
	priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT'], {
		error: 'Please select a priority',
	}),
})

type FormSchema = z.infer<typeof ValidationSchema>

interface Props {
	announcement: Announcement
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	propertyId?: string
}

export function EditDraftModal({
	announcement,
	opened,
	setOpened,
	propertyId,
}: Props) {
	const queryClient = useQueryClient()
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const { mutate: mutateGlobal, isPending: isPendingGlobal } =
		useUpdateAnnouncement()
	const { mutate: mutateProperty, isPending: isPendingProperty } =
		useUpdatePropertyAnnouncement()
	const isPending = propertyId ? isPendingProperty : isPendingGlobal

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			title: announcement.title,
			content: announcement.content,
			type: announcement.type,
			priority: announcement.priority,
		},
	})

	useEffect(() => {
		if (opened) {
			rhfMethods.reset({
				title: announcement.title,
				content: announcement.content,
				type: announcement.type,
				priority: announcement.priority,
			})
		}
	}, [opened, announcement, rhfMethods])

	const handleClose = () => setOpened(false)

	const onSubmit = (formData: FormSchema) => {
		const callbacks = {
			onError: () => toast.error('Failed to save changes. Try again.'),
			onSuccess: () => {
				toast.success('Draft updated.')
				void queryClient.invalidateQueries({
					queryKey: [QUERY_KEYS.ANNOUNCEMENTS],
				})
				handleClose()
			},
		}
		if (propertyId) {
			mutateProperty(
				{ clientId, propertyId, id: announcement.id, data: formData },
				callbacks,
			)
		} else {
			mutateGlobal({ clientId, id: announcement.id, data: formData }, callbacks)
		}
	}

	const contentLength = rhfMethods.watch('content')?.length ?? 0

	return (
		<Dialog open={opened} onOpenChange={setOpened}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Edit Draft</DialogTitle>
				</DialogHeader>
				<Form {...rhfMethods}>
					<form
						onSubmit={rhfMethods.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<FieldGroup>
							<FormField
								name="title"
								control={rhfMethods.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Title <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Announcement title" />
										</FormControl>
										<FormMessage />
										<FormDescription className="text-xs">
											Maximum of 60 characters.
										</FormDescription>
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
												className="h-40"
											/>
										</FormControl>
										<div className="text-muted-foreground text-right text-xs">
											{contentLength}/2000
										</div>
										<FormMessage />
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
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select type" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="COMMUNITY">Community</SelectItem>
														<SelectItem value="MAINTENANCE">
															Maintenance
														</SelectItem>
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
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
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
						</FieldGroup>

						<div className="flex justify-end gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								disabled={isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending && <Spinner />}
								Save Changes
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
