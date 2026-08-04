import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { InfoRow } from './info-row'
import { useUpdateTenant } from '~/api/tenants'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import { Card, CardAction, CardContent, CardHeader } from '~/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { ImageUpload } from '~/components/ui/image-upload'
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
import { TypographyH4 } from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'

const ID_TYPE_LABELS: Record<string, string> = {
	NATIONAL_ID: 'National ID',
	PASSPORT: 'Passport',
	DRIVER_LICENSE: "Driver's License",
	GHANA_CARD: 'Ghana Card',
}

const ValidationSchema = z.object({
	id_type: z.enum(['DRIVER_LICENSE', 'PASSPORT', 'NATIONAL_ID', 'GHANA_CARD'], {
		message: 'Please select an ID type',
	}),
	id_number: z.string().trim().min(1, 'ID number is required'),
	id_front_url: z.string().nullable().optional(),
	id_back_url: z.string().nullable().optional(),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function TenantProfileIdentificationCard({
	tenant,
}: {
	tenant: Tenant
}) {
	const revalidator = useRevalidator()
	const [isOpen, setIsOpen] = useState(false)

	const {
		upload: uploadFront,
		objectUrl: frontUrl,
		isLoading: isUploadingFront,
	} = useUploadObject('tenants/id-documents')

	const {
		upload: uploadBack,
		objectUrl: backUrl,
		isLoading: isUploadingBack,
	} = useUploadObject('tenants/id-documents')

	const defaultValues: FormSchema = {
		id_type: tenant.id_type || 'NATIONAL_ID',
		id_number: safeString(tenant.id_number),
		id_front_url: tenant.id_front_url ?? null,
		id_back_url: tenant.id_back_url ?? null,
	}

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues,
	})

	useEffect(() => {
		if (frontUrl) {
			rhfMethods.setValue('id_front_url', frontUrl, { shouldDirty: true })
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [frontUrl])

	useEffect(() => {
		if (backUrl) {
			rhfMethods.setValue('id_back_url', backUrl, { shouldDirty: true })
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [backUrl])

	const { handleSubmit, reset } = rhfMethods
	const { isPending, mutate } = useUpdateTenant()

	const handleOpenChange = (open: boolean) => {
		if (open) {
			reset(defaultValues)
		}
		setIsOpen(open)
	}

	const onSubmit = (data: FormSchema) => {
		mutate(
			{ tenant_id: tenant.id, data },
			{
				onError: () => {
					toast.error('Failed to update identification. Try again later.')
				},
				onSuccess: () => {
					toast.success('Identification updated successfully.')
					void revalidator.revalidate()
					setIsOpen(false)
				},
			},
		)
	}

	return (
		<Card>
			<CardHeader>
				<TypographyH4>Identification</TypographyH4>
				<CardAction>
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleOpenChange(true)}
						>
							<Pencil className="h-4 w-4" />
						</Button>
					</PropertyPermissionGuard>
				</CardAction>
			</CardHeader>
			<CardContent className="space-y-4">
				<Separator />
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<InfoRow label="ID Type" value={tenant?.id_type} />
					<InfoRow label="ID Number" value={tenant?.id_number} />
					<InfoRow
						label="ID Front"
						value={
							tenant?.id_front_url ? (
								<a
									href={tenant.id_front_url}
									target="_blank"
									rel="noreferrer"
									className="text-primary underline"
								>
									View
								</a>
							) : (
								'N/A'
							)
						}
					/>
					<InfoRow
						label="ID Back"
						value={
							tenant?.id_back_url ? (
								<a
									href={tenant.id_back_url}
									target="_blank"
									rel="noreferrer"
									className="text-primary underline"
								>
									View
								</a>
							) : (
								'N/A'
							)
						}
					/>
				</div>
			</CardContent>

			<Dialog open={isOpen} onOpenChange={handleOpenChange}>
				<DialogContent className="flex max-h-[85vh] flex-col overflow-hidden">
					<DialogHeader>
						<DialogTitle>Edit Identification</DialogTitle>
						<DialogDescription>
							Update the tenant&apos;s identification details.
						</DialogDescription>
					</DialogHeader>

					<div className="min-h-0 flex-1 overflow-y-auto px-1">
						<Form {...rhfMethods}>
							<form
								id="tenant-identification-form"
								className="space-y-4"
								onSubmit={handleSubmit(onSubmit)}
							>
								<FormField
									name="id_type"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												ID Type <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Please select" />
													</SelectTrigger>
													<SelectContent>
														{Object.entries(ID_TYPE_LABELS).map(
															([value, label]) => (
																<SelectItem key={value} value={value}>
																	{label}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="id_number"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												ID Number <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid grid-cols-2 gap-4">
									<ImageUpload
										hero
										shape="square"
										hint="Optional"
										acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
										imageSrc={safeString(rhfMethods.watch('id_front_url'))}
										label="ID Front"
										name="id_front_url"
										fileCallback={uploadFront}
										isUploading={isUploadingFront}
										dismissCallback={() =>
											rhfMethods.setValue('id_front_url', null, {
												shouldDirty: true,
											})
										}
										validation={{
											maxByteSize: 5242880,
										}}
									/>
									<ImageUpload
										hero
										shape="square"
										hint="Optional"
										acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
										imageSrc={safeString(rhfMethods.watch('id_back_url'))}
										label="ID Back"
										name="id_back_url"
										fileCallback={uploadBack}
										isUploading={isUploadingBack}
										dismissCallback={() =>
											rhfMethods.setValue('id_back_url', null, {
												shouldDirty: true,
											})
										}
										validation={{
											maxByteSize: 5242880,
										}}
									/>
								</div>
							</form>
						</Form>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							form="tenant-identification-form"
							disabled={isPending || !rhfMethods.formState.isDirty}
						>
							{isPending ? <Spinner /> : null} Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	)
}
