import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
	ArrowLeftRight,
	Building2,
	CircleUserRound,
	Pencil,
	TriangleAlert,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useGetClientUser } from '~/api/client-users'
import { useUpdateClient } from '~/api/clients'
import { DatePickerInput } from '~/components/date-picker-input'
import { ImageUpload } from '~/components/ui/image-upload'
import { useUploadObject } from '~/hooks/use-upload-object'
import { localizedDayjs } from '~/lib/date'
import {
	AddressInput,
	AddressSchema,
	type AddressInputSchema,
} from '~/components/address-input'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '~/components/ui/field'
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
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import {
	TypographyH3,
	TypographyH4,
	TypographyMuted,
} from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { getErrorMessage } from '~/lib/error-messages'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const subTypeOptions: Array<{
	label: string
	value: 'PROPERTY_MANAGER' | 'DEVELOPER' | 'AGENCY'
}> = [
	{ label: 'Property Manager', value: 'PROPERTY_MANAGER' },
	{ label: 'Developer', value: 'DEVELOPER' },
	{ label: 'Agency', value: 'AGENCY' },
]

function useClientMutation(
	clientId: string,
	successMessage: string,
	onSuccess: () => void,
) {
	const { mutate, isPending } = useUpdateClient()

	const submit = (
		data: Parameters<typeof mutate>[0],
		opts?: { onError?: (e: unknown) => void },
	) => {
		mutate(data, {
			onSuccess: () => {
				toast.success(successMessage)
				onSuccess()
			},
			onError: (e: unknown) => {
				if (opts?.onError) {
					opts.onError(e)
					return
				}
				toast.error(
					getErrorMessage(
						e instanceof Error ? e.message : 'Unknown error',
						'Something went wrong. Please try again.',
					),
				)
			},
		})
	}

	return { submit, isPending, clientId }
}

// ---------------------------------------------------------------------------
// Edit Profile dialog
// ---------------------------------------------------------------------------

const editProfileSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	sub_type: z
		.enum(['PROPERTY_MANAGER', 'DEVELOPER', 'AGENCY'], {
			error: 'Please select a sub type',
		})
		.optional(),
})

type EditProfileSchema = z.infer<typeof editProfileSchema>

function EditProfileDialog({
	client,
	open,
	onOpenChange,
	onSuccess,
}: {
	client: NonNullable<Client>
	open: boolean
	onOpenChange: (v: boolean) => void
	onSuccess: () => void
}) {
	const isCompany = client.type === 'COMPANY'
	const currentSubType =
		isCompany && client.sub_type !== 'LANDLORD'
			? (client.sub_type as 'PROPERTY_MANAGER' | 'DEVELOPER' | 'AGENCY')
			: undefined

	const { submit, isPending } = useClientMutation(
		client.id,
		'Profile updated',
		onSuccess,
	)

	const rhf = useForm<EditProfileSchema>({
		resolver: zodResolver(editProfileSchema),
		defaultValues: { name: client.name, sub_type: currentSubType },
	})

	const { control, handleSubmit, watch, setValue } = rhf

	const onSubmit = (data: EditProfileSchema) => {
		submit({
			clientId: client.id,
			name: data.name,
			...(isCompany && data.sub_type ? { sub_type: data.sub_type } : {}),
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm rounded-xl">
				<DialogHeader>
					<DialogTitle>Edit Profile</DialogTitle>
					<DialogDescription>
						Update your name and account type.
					</DialogDescription>
				</DialogHeader>

				<Form {...rhf}>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							name="name"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{isCompany ? 'Company Name' : 'Full Name'}
									</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{isCompany && (
							<FormItem>
								<FormLabel>Sub Type</FormLabel>
								<div className="flex flex-wrap gap-2">
									{subTypeOptions.map((opt) => {
										const isSelected = watch('sub_type') === opt.value
										return (
											<Button
												key={opt.value}
												type="button"
												variant={isSelected ? 'default' : 'outline'}
												size="sm"
												onClick={() =>
													setValue('sub_type', opt.value, {
														shouldDirty: true,
														shouldValidate: true,
													})
												}
											>
												{opt.label}
											</Button>
										)
									})}
								</div>
								<FormMessage>
									{rhf.formState.errors.sub_type?.message}
								</FormMessage>
							</FormItem>
						)}

						<div className="flex justify-end gap-3 pt-1">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isPending}
								className="min-w-[80px]"
							>
								{isPending ? <Spinner /> : null}
								Save
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

// ---------------------------------------------------------------------------
// Edit Company Details dialog
// ---------------------------------------------------------------------------

const editCompanySchema = z.object({
	description: z.string().max(500, 'Max 500 characters').optional(),
	registration_number: z.string().optional(),
	support_email: z.string().email('Invalid email').optional().or(z.literal('')),
	support_phone: z.string().optional(),
	website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type EditCompanySchema = z.infer<typeof editCompanySchema>

function EditCompanyDetailsDialog({
	client,
	open,
	onOpenChange,
	onSuccess,
}: {
	client: NonNullable<Client>
	open: boolean
	onOpenChange: (v: boolean) => void
	onSuccess: () => void
}) {
	const { submit, isPending } = useClientMutation(
		client.id,
		'Company details updated',
		onSuccess,
	)

	const rhf = useForm<EditCompanySchema>({
		resolver: zodResolver(editCompanySchema),
		defaultValues: {
			description: safeString(client.description) || '',
			registration_number: safeString(client.registration_number) || '',
			support_email: safeString(client.support_email) || '',
			support_phone: safeString(client.support_phone) || '',
			website_url: safeString(client.website_url) || '',
		},
	})

	const { control, handleSubmit } = rhf

	const onSubmit = (data: EditCompanySchema) => {
		submit({
			clientId: client.id,
			// Send null to clear a field when the user leaves it blank
			description: data.description || null,
			registration_number: data.registration_number || null,
			support_email: data.support_email || null,
			support_phone: data.support_phone || null,
			website_url: data.website_url || null,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg rounded-xl">
				<DialogHeader>
					<DialogTitle>Edit Company Details</DialogTitle>
					<DialogDescription>
						Leave a field blank to clear its value.
					</DialogDescription>
				</DialogHeader>

				<Form {...rhf}>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							name="description"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>About</FormLabel>
									<FormControl>
										<Textarea
											placeholder="About the company..."
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormDescription>Optional</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<FormField
								name="registration_number"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Registration Number</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormDescription>Optional</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="support_email"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Support Email</FormLabel>
										<FormControl>
											<Input type="email" {...field} />
										</FormControl>
										<FormDescription>Optional</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="support_phone"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Support Phone</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormDescription>Optional</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="website_url"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Website</FormLabel>
										<FormControl>
											<Input placeholder="https://example.com" {...field} />
										</FormControl>
										<FormDescription>Optional</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</FieldGroup>

						<div className="flex justify-end gap-3 pt-1">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isPending}
								className="min-w-[80px]"
							>
								{isPending ? <Spinner /> : null}
								Save
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

// ---------------------------------------------------------------------------
// Edit Location dialog
// ---------------------------------------------------------------------------

const editLocationSchema = AddressSchema

type EditLocationSchema = AddressInputSchema

function EditLocationDialog({
	client,
	open,
	onOpenChange,
	onSuccess,
}: {
	client: NonNullable<Client>
	open: boolean
	onOpenChange: (v: boolean) => void
	onSuccess: () => void
}) {
	const { submit, isPending } = useClientMutation(
		client.id,
		'Location updated',
		onSuccess,
	)

	const rhf = useForm<EditLocationSchema>({
		resolver: zodResolver(editLocationSchema),
		defaultValues: {
			addressSearch: safeString(client.address),
			address: safeString(client.address),
			city: safeString(client.city),
			region: safeString(client.region),
			country: safeString(client.country),
			latitude: client.latitude,
			longitude: client.longitude,
		},
	})

	const { handleSubmit, formState } = rhf

	const isAddressInvalid =
		!!formState.errors.addressSearch ||
		!!formState.errors.address ||
		!!formState.errors.city ||
		!!formState.errors.region ||
		!!formState.errors.country ||
		!!formState.errors.latitude ||
		!!formState.errors.longitude

	const onSubmit = (data: EditLocationSchema) => {
		submit({
			clientId: client.id,
			address: data.address,
			city: data.city,
			region: data.region,
			country: data.country,
			latitude: data.latitude,
			longitude: data.longitude,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm rounded-xl">
				<DialogHeader>
					<DialogTitle>Edit Location</DialogTitle>
					<DialogDescription>
						Search and select your address to update location details.
					</DialogDescription>
				</DialogHeader>

				<Form {...rhf}>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<FieldGroup>
							<Field data-invalid={isAddressInvalid}>
								<FieldLabel>Address</FieldLabel>
								<AddressInput />
								{isAddressInvalid && (
									<FieldError
										errors={[
											{ message: 'Kindly select a location from the list' },
										]}
									/>
								)}
							</Field>
						</FieldGroup>

						<div className="flex justify-end gap-3 pt-1">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isPending}
								className="min-w-[80px]"
							>
								{isPending ? <Spinner /> : null}
								Save
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

// ---------------------------------------------------------------------------
// Switch-to-Company form
// ---------------------------------------------------------------------------

const toCompanySchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	sub_type: z.enum(['PROPERTY_MANAGER', 'DEVELOPER', 'AGENCY'], {
		error: 'Please select a sub type',
	}),
	description: z.string().max(500, 'Max 500 characters').optional(),
	registration_number: z.string().optional(),
	support_email: z.string().email('Invalid email').optional().or(z.literal('')),
	support_phone: z.string().optional(),
	website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type ToCompanyFormSchema = z.infer<typeof toCompanySchema>

function SwitchToCompanyForm({
	currentName,
	clientId,
	onSuccess,
}: {
	currentName: string
	clientId: string
	onSuccess: () => void
}) {
	const { submit, isPending } = useClientMutation(
		clientId,
		'Account type updated to Company',
		onSuccess,
	)

	const rhf = useForm<ToCompanyFormSchema>({
		resolver: zodResolver(toCompanySchema),
		defaultValues: { name: currentName },
	})

	const { control, handleSubmit, watch, setValue } = rhf

	const onSubmit = (data: ToCompanyFormSchema) => {
		submit({
			clientId,
			type: 'COMPANY',
			sub_type: data.sub_type,
			name: data.name,
			description: data.description || null,
			registration_number: data.registration_number || null,
			support_email: data.support_email || null,
			support_phone: data.support_phone || null,
			website_url: data.website_url || null,
		})
	}

	return (
		<Form {...rhf}>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					name="name"
					control={control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Company Name</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormItem>
					<FormLabel>Sub Type</FormLabel>
					<div className="flex flex-wrap gap-2">
						{subTypeOptions.map((opt) => {
							const isSelected = watch('sub_type') === opt.value
							return (
								<Button
									key={opt.value}
									type="button"
									variant={isSelected ? 'default' : 'outline'}
									size="sm"
									onClick={() =>
										setValue('sub_type', opt.value, {
											shouldDirty: true,
											shouldValidate: true,
										})
									}
								>
									{opt.label}
								</Button>
							)
						})}
					</div>
					<FormMessage>{rhf.formState.errors.sub_type?.message}</FormMessage>
				</FormItem>

				<FormField
					name="description"
					control={control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>About</FormLabel>
							<FormControl>
								<Textarea
									placeholder="About the company..."
									rows={3}
									{...field}
								/>
							</FormControl>
							<FormDescription>Optional</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						name="registration_number"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Registration Number</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormDescription>Optional</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="support_email"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Support Email</FormLabel>
								<FormControl>
									<Input type="email" {...field} />
								</FormControl>
								<FormDescription>Optional</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="support_phone"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Support Phone</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormDescription>Optional</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="website_url"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Website</FormLabel>
								<FormControl>
									<Input placeholder="https://example.com" {...field} />
								</FormControl>
								<FormDescription>Optional</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</FieldGroup>

				<div className="flex justify-end gap-3 pt-2">
					<Button type="submit" disabled={isPending} className="min-w-[120px]">
						{isPending ? <Spinner /> : null}
						Switch to Company
					</Button>
				</div>
			</form>
		</Form>
	)
}

// ---------------------------------------------------------------------------
// Switch-to-Individual form
// ---------------------------------------------------------------------------

const toIndividualSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
})

type ToIndividualFormSchema = z.infer<typeof toIndividualSchema>

function SwitchToIndividualForm({
	currentName,
	clientId,
	onSuccess,
}: {
	currentName: string
	clientId: string
	onSuccess: () => void
}) {
	const { submit, isPending } = useClientMutation(
		clientId,
		'Account type updated to Individual',
		onSuccess,
	)

	const rhf = useForm<ToIndividualFormSchema>({
		resolver: zodResolver(toIndividualSchema),
		defaultValues: { name: currentName },
	})

	const { control, handleSubmit } = rhf

	const onSubmit = (data: ToIndividualFormSchema) => {
		submit({
			clientId,
			type: 'INDIVIDUAL',
			sub_type: 'LANDLORD',
			name: data.name,
		})
	}

	return (
		<Form {...rhf}>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					name="name"
					control={control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Full Name</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-3 pt-2">
					<Button type="submit" disabled={isPending} className="min-w-[140px]">
						{isPending ? <Spinner /> : null}
						Switch to Individual
					</Button>
				</div>
			</form>
		</Form>
	)
}

// ---------------------------------------------------------------------------
// Edit Identity dialog
// ---------------------------------------------------------------------------

const idTypeOptions = [
	{ label: 'National ID', value: 'NATIONAL_ID' },
	{ label: 'Passport', value: 'PASSPORT' },
	{ label: "Driver's License", value: 'DRIVERS_LICENSE' },
] as const

const editIdentitySchema = z.object({
	id_type: z
		.enum(['DRIVERS_LICENSE', 'PASSPORT', 'NATIONAL_ID'])
		.optional()
		.nullable(),
	id_number: z.string().optional().nullable(),
	id_expiry: z.date().optional().nullable(),
	id_document_url: z.string().optional().nullable(),
})

type EditIdentitySchema = z.infer<typeof editIdentitySchema>

const startIdExpiryDate = localizedDayjs()
	.subtract(2, 'month')
	.startOf('day')
	.toDate()
const maxIdExpiryDate = localizedDayjs().add(20, 'year').toDate()

function EditIdentityDialog({
	client,
	open,
	onOpenChange,
	onSuccess,
}: {
	client: NonNullable<Client>
	open: boolean
	onOpenChange: (v: boolean) => void
	onSuccess: () => void
}) {
	const { submit, isPending } = useClientMutation(
		client.id,
		'Identity updated',
		onSuccess,
	)

	const {
		upload,
		objectUrl,
		isLoading: isUploading,
	} = useUploadObject('property-owners/id-documents')

	const rhf = useForm<EditIdentitySchema>({
		resolver: zodResolver(editIdentitySchema),
		defaultValues: {
			id_type: client.id_type ?? null,
			id_number: safeString(client.id_number) || null,
			id_expiry: client.id_expiry ? new Date(client.id_expiry) : null,
			id_document_url: safeString(client.id_document_url) || null,
		},
	})

	const { control, handleSubmit, setValue, watch } = rhf

	useEffect(() => {
		if (objectUrl) {
			setValue('id_document_url', objectUrl, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [objectUrl])

	const onSubmit = (data: EditIdentitySchema) => {
		submit({
			clientId: client.id,
			id_type: data.id_type ?? null,
			id_number: data.id_number ?? null,
			id_expiry: data.id_expiry
				? localizedDayjs(data.id_expiry).format('YYYY-MM-DD')
				: null,
			id_document_url: data.id_document_url ?? null,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm rounded-xl">
				<DialogHeader>
					<DialogTitle>Edit Identity</DialogTitle>
					<DialogDescription>
						Update your identity document details.
					</DialogDescription>
				</DialogHeader>

				<Form {...rhf}>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<FormItem>
							<FormLabel>ID Type</FormLabel>
							<div className="flex flex-wrap gap-2">
								{idTypeOptions.map((opt) => {
									const isSelected = watch('id_type') === opt.value
									return (
										<Button
											key={opt.value}
											type="button"
											variant={isSelected ? 'default' : 'outline'}
											size="sm"
											onClick={() =>
												setValue('id_type', isSelected ? null : opt.value, {
													shouldDirty: true,
													shouldValidate: true,
												})
											}
										>
											{opt.label}
										</Button>
									)
								})}
							</div>
						</FormItem>

						<FormField
							name="id_number"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID Number</FormLabel>
									<FormControl>
										<Input
											{...field}
											value={field.value ?? ''}
											onChange={(e) => field.onChange(e.target.value || null)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="id_expiry"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID Expiry</FormLabel>
									<FormControl>
										<DatePickerInput
											value={field.value ?? undefined}
											onChange={(date) => field.onChange(date ?? null)}
											disabled={(date) => date < startIdExpiryDate}
											startMonth={startIdExpiryDate}
											endMonth={maxIdExpiryDate}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<ImageUpload
							shape="square"
							hint="Optional"
							acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
							error={rhf.formState.errors?.id_document_url?.message}
							fileCallback={upload}
							isUploading={isUploading}
							dismissCallback={() => {
								setValue('id_document_url', null, {
									shouldDirty: true,
									shouldValidate: true,
								})
							}}
							imageSrc={safeString(watch('id_document_url'))}
							label="ID Document"
							name="id_document"
							validation={{
								maxByteSize: 5120000, // 5MB
							}}
						/>

						<div className="flex justify-end gap-3 pt-1">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isPending}
								className="min-w-[80px]"
							>
								{isPending ? <Spinner /> : null}
								Save
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

// ---------------------------------------------------------------------------
// Main module
// ---------------------------------------------------------------------------

export function GeneralSettingsModule() {
	const queryClient = useQueryClient()
	const { clientUser: clientUserServer } = useClient()
	const { data: currentUser } = useGetClientUser(
		safeString(clientUserServer?.client_id),
		safeString(clientUserServer?.user_id),
		clientUserServer,
	)

	const [showWarning, setShowWarning] = useState(false)
	const [showSwitchForm, setShowSwitchForm] = useState(false)
	const [showEditProfile, setShowEditProfile] = useState(false)
	const [showEditCompany, setShowEditCompany] = useState(false)
	const [showEditLocation, setShowEditLocation] = useState(false)
	const [showEditIdentity, setShowEditIdentity] = useState(false)

	const client = currentUser?.client
	const isCompany = client?.type === 'COMPANY'
	const targetType = isCompany ? 'Individual' : 'Company'
	const targetTypeIcon = isCompany ? CircleUserRound : Building2

	const handleSwitchConfirmed = () => {
		setShowWarning(false)
		setShowSwitchForm(true)
	}

	const handleMutationSuccess = () => {
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.CLIENT_USER, safeString(currentUser?.id)],
		})
	}

	const handleSwitchSuccess = () => {
		setShowSwitchForm(false)
		handleMutationSuccess()
	}

	return (
		<div className="mx-auto max-w-4xl space-y-8 px-4 pt-4 pb-10 lg:px-4 lg:pt-1">
			{/* Page header */}
			<div className="space-y-1">
				<TypographyH3>General Settings</TypographyH3>
				<TypographyMuted>
					Update and manage your essential information.
				</TypographyMuted>
			</div>

			<Separator />

			{/* Profile section */}
			<section className="bg-card relative grid gap-8 rounded-xl border p-4 shadow-sm sm:grid-cols-3 sm:items-start md:p-6">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="absolute top-3 right-3 gap-1.5 text-xs"
					onClick={() => setShowEditProfile(true)}
				>
					<Pencil className="size-3.5" />
					Edit
				</Button>

				<div className="space-y-2">
					<TypographyH4 className="text-lg font-semibold">Profile</TypographyH4>
					<TypographyMuted className="text-sm">
						Your account name and ownership type.
					</TypographyMuted>
				</div>

				<div className="space-y-5 sm:col-span-2">
					<div className="space-y-1">
						<Label className="text-sm font-medium">Name</Label>
						<p className="text-foreground text-sm">
							{safeString(client?.name)}
						</p>
					</div>

					<div className="space-y-1">
						<Label className="text-sm font-medium">Type</Label>
						<div className="flex flex-wrap gap-2">
							<Badge variant="outline" className="gap-1">
								{isCompany ? (
									<Building2 className="size-3" />
								) : (
									<CircleUserRound className="size-3" />
								)}
								{isCompany ? 'Company' : 'Individual'}
							</Badge>
							{client?.sub_type && (
								<Badge variant="secondary">
									{client.sub_type
										.toLowerCase()
										.replace(/_/g, ' ')
										.replace(/\b\w/g, (c) => c.toUpperCase())}
								</Badge>
							)}
						</div>
					</div>

					<Button
						type="button"
						variant="outline"
						size="sm"
						className="gap-2"
						onClick={() => setShowWarning(true)}
					>
						<ArrowLeftRight className="size-4" />
						Switch to {targetType}
					</Button>
				</div>
			</section>

			{/* Company Details — only for COMPANY */}
			{isCompany && (
				<section className="bg-card relative grid gap-8 rounded-xl border p-4 shadow-sm sm:grid-cols-3 sm:items-start md:p-6">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="absolute top-3 right-3 gap-1.5 text-xs"
						onClick={() => setShowEditCompany(true)}
					>
						<Pencil className="size-3.5" />
						Edit
					</Button>

					<div className="space-y-2">
						<TypographyH4 className="text-lg font-semibold">
							Company Details
						</TypographyH4>
						<TypographyMuted className="text-sm">
							Information about your company.
						</TypographyMuted>
					</div>

					<div className="space-y-5 sm:col-span-2">
						<div className="grid gap-5 sm:grid-cols-2">
							<div className="space-y-1">
								<Label className="text-sm font-medium">Description</Label>
								<p className="text-muted-foreground text-sm">
									{safeString(client?.description) || '—'}
								</p>
							</div>
							<div className="space-y-1">
								<Label className="text-sm font-medium">
									Registration Number
								</Label>
								<p className="text-muted-foreground text-sm">
									{safeString(client?.registration_number) || '—'}
								</p>
							</div>
							<div className="space-y-1">
								<Label className="text-sm font-medium">Support Email</Label>
								<p className="text-muted-foreground text-sm">
									{safeString(client?.support_email) || '—'}
								</p>
							</div>
							<div className="space-y-1">
								<Label className="text-sm font-medium">Support Phone</Label>
								<p className="text-muted-foreground text-sm">
									{safeString(client?.support_phone) || '—'}
								</p>
							</div>
							<div className="space-y-1 sm:col-span-2">
								<Label className="text-sm font-medium">Website</Label>
								<p className="text-muted-foreground text-sm">
									{safeString(client?.website_url) || '—'}
								</p>
							</div>
						</div>
					</div>
				</section>
			)}

			{/* Business Location */}
			<section className="bg-card relative grid gap-8 rounded-xl border p-4 shadow-sm sm:grid-cols-3 sm:items-start md:p-6">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="absolute top-3 right-3 gap-1.5 text-xs"
					onClick={() => setShowEditLocation(true)}
				>
					<Pencil className="size-3.5" />
					Edit
				</Button>

				<div className="space-y-2">
					<TypographyH4 className="text-lg font-semibold">
						Business Location
					</TypographyH4>
					<TypographyMuted className="text-sm">
						Your official physical address.
					</TypographyMuted>
				</div>

				<div className="space-y-5 sm:col-span-2">
					<div className="space-y-1">
						<Label className="text-sm font-medium">Address</Label>
						<p className="text-muted-foreground text-sm">
							{safeString(client?.address) || '—'}
						</p>
					</div>

					<div className="grid gap-5 sm:grid-cols-3">
						<div className="space-y-1">
							<Label className="text-sm font-medium">Country</Label>
							<p className="text-muted-foreground text-sm">
								{safeString(client?.country) || '—'}
							</p>
						</div>
						<div className="space-y-1">
							<Label className="text-sm font-medium">Region</Label>
							<p className="text-muted-foreground text-sm">
								{safeString(client?.region) || '—'}
							</p>
						</div>
						<div className="space-y-1">
							<Label className="text-sm font-medium">City</Label>
							<p className="text-muted-foreground text-sm">
								{safeString(client?.city) || '—'}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Identity — only for INDIVIDUAL */}
			{!isCompany && (
				<section className="bg-card relative grid gap-8 rounded-xl border p-4 shadow-sm sm:grid-cols-3 sm:items-start md:p-6">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="absolute top-3 right-3 gap-1.5 text-xs"
						onClick={() => setShowEditIdentity(true)}
					>
						<Pencil className="size-3.5" />
						Edit
					</Button>

					<div className="space-y-2">
						<TypographyH4 className="text-lg font-semibold">
							Identity
						</TypographyH4>
						<TypographyMuted className="text-sm">
							Your government-issued identification.
						</TypographyMuted>
					</div>

					<div className="space-y-5 sm:col-span-2">
						<div className="grid gap-5 sm:grid-cols-2">
							<div className="space-y-1">
								<Label className="text-sm font-medium">ID Type</Label>
								<p className="text-muted-foreground text-sm">
									{client?.id_type
										? (idTypeOptions.find((o) => o.value === client.id_type)
												?.label ?? '—')
										: '—'}
								</p>
							</div>
							<div className="space-y-1">
								<Label className="text-sm font-medium">ID Number</Label>
								<p className="text-muted-foreground text-sm">
									{safeString(client?.id_number) || '—'}
								</p>
							</div>
							<div className="space-y-1">
								<Label className="text-sm font-medium">Expiry Date</Label>
								<p className="text-muted-foreground text-sm">
									{client?.id_expiry
										? localizedDayjs(client.id_expiry).format('MMM D, YYYY')
										: '—'}
								</p>
							</div>
							{client?.id_document_url && (
								<div className="space-y-1">
									<Label className="text-sm font-medium">ID Document</Label>
									<a
										href={client.id_document_url}
										target="_blank"
										rel="noreferrer"
										className="text-primary text-sm underline underline-offset-4"
									>
										View document
									</a>
								</div>
							)}
						</div>
					</div>
				</section>
			)}

			{/* ------------------------------------------------------------------ */}
			{/* Dialogs                                                              */}
			{/* ------------------------------------------------------------------ */}

			{/* Edit Profile */}
			{client && (
				<EditProfileDialog
					client={client}
					open={showEditProfile}
					onOpenChange={setShowEditProfile}
					onSuccess={() => {
						setShowEditProfile(false)
						handleMutationSuccess()
					}}
				/>
			)}

			{/* Edit Company Details */}
			{client && isCompany && (
				<EditCompanyDetailsDialog
					client={client}
					open={showEditCompany}
					onOpenChange={setShowEditCompany}
					onSuccess={() => {
						setShowEditCompany(false)
						handleMutationSuccess()
					}}
				/>
			)}

			{/* Edit Location */}
			{client && (
				<EditLocationDialog
					client={client}
					open={showEditLocation}
					onOpenChange={setShowEditLocation}
					onSuccess={() => {
						setShowEditLocation(false)
						handleMutationSuccess()
					}}
				/>
			)}

			{/* Edit Identity */}
			{client && !isCompany && (
				<EditIdentityDialog
					client={client}
					open={showEditIdentity}
					onOpenChange={setShowEditIdentity}
					onSuccess={() => {
						setShowEditIdentity(false)
						handleMutationSuccess()
					}}
				/>
			)}

			{/* Type switch warning */}
			<AlertDialog open={showWarning} onOpenChange={setShowWarning}>
				<AlertDialogContent className="rounded-xl">
					<AlertDialogHeader>
						<div className="flex items-center gap-2">
							<TriangleAlert className="text-destructive size-5" />
							<AlertDialogTitle>Switch to {targetType}?</AlertDialogTitle>
						</div>
						<AlertDialogDescription>
							Some information specific to your current account type will be
							permanently removed. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive hover:bg-destructive/90 text-white"
							onClick={handleSwitchConfirmed}
						>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Switch form dialog */}
			<Dialog open={showSwitchForm} onOpenChange={setShowSwitchForm}>
				<DialogContent className="max-w-lg rounded-xl">
					<DialogHeader>
						<div className="flex items-center gap-2">
							{(() => {
								const Icon = targetTypeIcon
								return <Icon className="size-5" />
							})()}
							<DialogTitle>Switch to {targetType}</DialogTitle>
						</div>
						<DialogDescription>
							Fill in the details for your new account type. Common fields have
							been pre-filled.
						</DialogDescription>
					</DialogHeader>

					{client?.id &&
						(isCompany ? (
							<SwitchToIndividualForm
								currentName={safeString(client.name)}
								clientId={client.id}
								onSuccess={handleSwitchSuccess}
							/>
						) : (
							<SwitchToCompanyForm
								currentName={safeString(client.name)}
								clientId={client.id}
								onSuccess={handleSwitchSuccess}
							/>
						))}
				</DialogContent>
			</Dialog>
		</div>
	)
}
