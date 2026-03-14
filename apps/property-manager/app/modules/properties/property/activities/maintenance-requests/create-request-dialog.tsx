import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	useCreateMaintenanceRequest,
	type CreateMaintenanceRequestInput,
} from '~/api/maintenance-requests'
import { useGetPropertyUnits } from '~/api/units'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
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
import { Textarea } from '~/components/ui/textarea'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'

const schema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().min(1, 'Description is required'),
	priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'], {
		error: 'Priority is required',
	}),
	category: z.enum(['PLUMBING', 'ELECTRICAL', 'HVAC', 'OTHER'], {
		error: 'Category is required',
	}),
	unit_id: z.string().optional(),
	visibility: z.enum(['TENANT_VISIBLE', 'INTERNAL_ONLY']),
})

type FormValues = z.infer<typeof schema>

interface CreateRequestDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	propertyId: string
}

export function CreateRequestDialog({
	open,
	onOpenChange,
	propertyId,
}: CreateRequestDialogProps) {
	const queryClient = useQueryClient()
	const createRequest = useCreateMaintenanceRequest()

	const { data: units } = useGetPropertyUnits({
		property_id: propertyId,
		pagination: { page: 1, per: 200 },
	})

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			title: '',
			description: '',
			priority: undefined as unknown as MaintenanceRequestPriority,
			category: undefined as unknown as MaintenanceRequestCategory,
			unit_id: undefined,
			visibility: 'TENANT_VISIBLE' as const,
		},
	})

	const onSubmit = async (values: FormValues) => {
		try {
			const input: CreateMaintenanceRequestInput = {
				title: values.title,
				description: values.description,
				priority: values.priority,
				category: values.category,
				visibility: values.visibility,
				...(values.unit_id ? { unit_id: values.unit_id } : {}),
			}
			await createRequest.mutateAsync(input)
			toast.success('Maintenance request created')
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS],
			})
			form.reset()
			onOpenChange(false)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to create request')
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>New Maintenance Request</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-4"
					>
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
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
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Describe the issue..."
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="priority"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Priority</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
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
										<FormLabel>Category</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select category" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="PLUMBING">Plumbing</SelectItem>
												<SelectItem value="ELECTRICAL">Electrical</SelectItem>
												<SelectItem value="HVAC">HVAC</SelectItem>
												<SelectItem value="OTHER">Other</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="unit_id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Unit (optional)</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={safeString(field.value)}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select unit" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{units?.rows.map((unit) => (
													<SelectItem key={unit.id} value={unit.id}>
														{unit.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="visibility"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Visibility</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="TENANT_VISIBLE">
													Tenant Visible
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

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={createRequest.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={createRequest.isPending}>
								{createRequest.isPending ? 'Creating...' : 'Create Request'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
