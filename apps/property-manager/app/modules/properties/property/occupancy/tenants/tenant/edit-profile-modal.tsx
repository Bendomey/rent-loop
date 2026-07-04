import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUpdateTenant } from '~/api/tenants'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import { CardAction } from '~/components/ui/card'
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
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { ImageUpload } from '~/components/ui/image-upload'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'

const ValidationSchema = z.object({
	first_name: z.string().trim().min(1, 'First name is required'),
	last_name: z.string().trim().min(1, 'Last name is required'),
	other_names: z.string().optional(),
	email: z.string().email('Please enter a valid email'),
	profile_photo_url: z.string().nullable().optional(),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function TenantEditProfileModal({ tenant }: { tenant: Tenant }) {
	const revalidator = useRevalidator()
	const [isOpen, setIsOpen] = useState(false)

	const {
		upload,
		objectUrl,
		isLoading: isUploading,
	} = useUploadObject('tenants/profile-photos')

	const defaultValues: FormSchema = {
		first_name: safeString(tenant.first_name),
		last_name: safeString(tenant.last_name),
		other_names: safeString(tenant.other_names) || '',
		email: safeString(tenant.email),
		profile_photo_url: tenant.profile_photo_url ?? null,
	}

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues,
	})

	useEffect(() => {
		if (objectUrl) {
			rhfMethods.setValue('profile_photo_url', objectUrl, {
				shouldDirty: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [objectUrl])

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
					toast.error('Failed to update tenant profile. Try again later.')
				},
				onSuccess: () => {
					toast.success('Tenant profile updated successfully.')
					void revalidator.revalidate()
					setIsOpen(false)
				},
			},
		)
	}

	return (
		<>
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

			<Dialog open={isOpen} onOpenChange={handleOpenChange}>
				<DialogContent className="flex max-h-[85vh] flex-col overflow-hidden">
					<DialogHeader>
						<DialogTitle>Edit Tenant Profile</DialogTitle>
						<DialogDescription>
							Update the tenant&apos;s name, profile photo, and email.
						</DialogDescription>
					</DialogHeader>

					<div className="min-h-0 flex-1 overflow-y-auto px-1">
						<Form {...rhfMethods}>
							<form
								id="tenant-edit-profile-form"
								className="space-y-4"
								onSubmit={handleSubmit(onSubmit)}
							>
								<ImageUpload
									shape="circle"
									hint="Optional"
									acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
									imageSrc={safeString(rhfMethods.watch('profile_photo_url'))}
									label="Profile Photo"
									name="profile_photo_url"
									fileCallback={upload}
									isUploading={isUploading}
									dismissCallback={() =>
										rhfMethods.setValue('profile_photo_url', null, {
											shouldDirty: true,
										})
									}
									validation={{
										maxByteSize: 5242880,
									}}
								/>
								<FormField
									name="first_name"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												First Name <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="last_name"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Last Name <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="other_names"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Other Names</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
											<FormDescription>Optional</FormDescription>
										</FormItem>
									)}
								/>
								<FormField
									name="email"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormItem>
									<FormLabel>Phone</FormLabel>
									<FormControl>
										<Input
											type="text"
											value={safeString(tenant.phone)}
											disabled
										/>
									</FormControl>
									<FormDescription>
										Phone number can&apos;t be changed.
									</FormDescription>
								</FormItem>
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
							form="tenant-edit-profile-form"
							disabled={isPending || !rhfMethods.formState.isDirty}
						>
							{isPending ? <Spinner /> : null} Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
