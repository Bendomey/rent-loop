import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	useCreateMaintenanceRequest,
	type CreateMaintenanceRequestInput,
} from '~/api/maintenance-requests'
import { useGetPropertyUnits } from '~/api/units'
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
import { TypographyH3, TypographyMuted } from '~/components/ui/typography'
import { useUploadObjectBulk } from '~/hooks/use-upload-object-bulk'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

const schema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().min(1, 'Description is required'),
	priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'], {
		error: 'Priority is required',
	}),
	category: z.enum(['PLUMBING', 'ELECTRICAL', 'HVAC', 'OTHER'], {
		error: 'Category is required',
	}),
	unit_id: z.string({ error: 'Unit is required' }).min(1, 'Unit is required'),
	visibility: z.enum(['TENANT_VISIBLE', 'INTERNAL_ONLY']),
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

	const { upload, remove, uploadingIds, uploadedUrls, isUploading } =
		useUploadObjectBulk('maintenance-requests')

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			title: '',
			description: '',
			priority: undefined,
			category: undefined,
			unit_id: undefined,
			visibility: 'TENANT_VISIBLE',
			attachments: [],
		},
	})

	useEffect(() => {
		form.setValue('attachments', uploadedUrls)
	}, [uploadedUrls, form])

	const onSubmit = async (values: FormValues) => {
		try {
			const input: CreateMaintenanceRequestInput = {
				client_id: safeString(clientUser?.client_id),
				title: values.title,
				description: values.description,
				priority: values.priority,
				category: values.category,
				visibility: values.visibility,
				unit_id: values.unit_id,
				property_id: resolvedPropertyId,
				attachments: values.attachments ?? [],
			}
			await createRequest.mutateAsync(input)
			toast.success('Maintenance request created')
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS],
			})
			void navigate(
				`/properties/${resolvedPropertyId}/activities/maintenance-requests`,
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
					Report a new maintenance issue for a unit.
				</TypographyMuted>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<div className="grid grid-cols-2">
						<FormField
							control={form.control}
							name="unit_id"
							render={({ field }) => (
								<FormItem className="">
									<FormLabel>
										Unit <span className="text-red-600">*</span>
									</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="w-full">
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
									<Select onValueChange={field.onChange} value={field.value}>
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
