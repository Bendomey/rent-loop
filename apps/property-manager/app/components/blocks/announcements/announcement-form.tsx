import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCreateAnnouncement } from '~/api/announcements'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/components/ui/dialog'
import { FieldGroup } from '~/components/ui/field'
import {
	Form,
	FormControl,
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

const ValidationSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	content: z.string().min(1, 'Content is required'),
	type: z.enum(['MAINTENANCE', 'COMMUNITY', 'POLICY_CHANGE', 'EMERGENCY'], {
		error: 'Please select a type',
	}),
	priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT'], {
		error: 'Please select a priority',
	}),
})

type FormSchema = z.infer<typeof ValidationSchema>

interface Props {
	propertyId?: string
}

export function AnnouncementForm({ propertyId }: Props) {
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)
	const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)
	const { mutate, isPending } = useCreateAnnouncement()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			title: '',
			content: '',
			type: 'COMMUNITY',
			priority: 'NORMAL',
		},
	})

	const handleClose = () => {
		rhfMethods.reset()
		setExpiresAt(undefined)
		setOpen(false)
	}

	const onSubmit = (formData: FormSchema) => {
		mutate(
			{
				title: formData.title,
				content: formData.content,
				type: formData.type,
				priority: formData.priority,
				property_id: propertyId,
				expires_at: expiresAt ? expiresAt.toISOString() : undefined,
			},
			{
				onError: () =>
					toast.error('Failed to create announcement. Try again later.'),
				onSuccess: () => {
					toast.success('Announcement created as draft.')
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.ANNOUNCEMENTS],
					})
					handleClose()
				},
			},
		)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">
					<Plus className="size-4" />
					New Announcement
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>New Announcement</DialogTitle>
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
												rows={4}
											/>
										</FormControl>
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

							<div className="flex flex-col gap-2">
								<FormLabel>Expires At (optional)</FormLabel>
								<DatePickerInput
									value={expiresAt}
									onChange={setExpiresAt}
									placeholder="No expiry"
									startMonth={new Date()}
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
								Create Draft
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
