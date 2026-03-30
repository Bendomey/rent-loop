import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUpdateProperty } from '~/api/properties'
import {
	AddressInput,
	AddressSchema,
	type AddressInputSchema,
} from '~/components/address-input'
import {
	PermissionGuard,
	PropertyPermissionGuard,
} from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '~/components/ui/field'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import {
	TypographyH3,
	TypographyH4,
	TypographyMuted,
} from '~/components/ui/typography'
import { getErrorMessage } from '~/lib/error-messages'
import { safeString } from '~/lib/strings'
import { useProperty } from '~/providers/property-provider'
import ConfirmDeletePropertyModule from './delete'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function usePropertyMutation(
	propertyId: string,
	successMessage: string,
	onSuccess: () => void,
) {
	const { mutate, isPending } = useUpdateProperty()

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

	return { submit, isPending, propertyId }
}

// ---------------------------------------------------------------------------
// Edit Basic Details dialog
// ---------------------------------------------------------------------------

const editBasicSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	description: z.string().max(500, 'Max 500 characters').optional(),
	type: z.enum(['SINGLE', 'MULTI'], { error: 'Please select a type' }),
})

type EditBasicSchema = z.infer<typeof editBasicSchema>

const typeOptions: Array<{ label: string; value: 'SINGLE' | 'MULTI' }> = [
	{ label: 'Single', value: 'SINGLE' },
	{ label: 'Multi', value: 'MULTI' },
]

function EditBasicDetailsDialog({
	property,
	open,
	onOpenChange,
	onSuccess,
}: {
	property: Property
	open: boolean
	onOpenChange: (v: boolean) => void
	onSuccess: () => void
}) {
	const { submit, isPending } = usePropertyMutation(
		property.id,
		'Property details updated',
		onSuccess,
	)

	const rhf = useForm<EditBasicSchema>({
		resolver: zodResolver(editBasicSchema),
		defaultValues: {
			name: property.name,
			description: safeString(property.description) || '',
			type: property.type,
		},
	})

	const { control, handleSubmit, watch, setValue } = rhf

	const onSubmit = (data: EditBasicSchema) => {
		submit({
			propertyId: property.id,
			data: {
				name: data.name,
				description: data.description || null,
				type: data.type,
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm rounded-xl">
				<DialogHeader>
					<DialogTitle>Edit Basic Details</DialogTitle>
					<DialogDescription>
						Update the property name, description, and type.
					</DialogDescription>
				</DialogHeader>

				<Form {...rhf}>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							name="name"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Property Name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="description"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Describe the property..."
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormItem>
							<FormLabel>Type</FormLabel>
							<div className="flex gap-2">
								{typeOptions.map((opt) => {
									const isSelected = watch('type') === opt.value
									return (
										<Button
											key={opt.value}
											type="button"
											variant={isSelected ? 'default' : 'outline'}
											size="sm"
											onClick={() =>
												setValue('type', opt.value, {
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
								{rhf.formState.errors.type?.message}
							</FormMessage>
						</FormItem>

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
	property,
	open,
	onOpenChange,
	onSuccess,
}: {
	property: Property
	open: boolean
	onOpenChange: (v: boolean) => void
	onSuccess: () => void
}) {
	const { submit, isPending } = usePropertyMutation(
		property.id,
		'Location updated',
		onSuccess,
	)

	const rhf = useForm<EditLocationSchema>({
		resolver: zodResolver(editLocationSchema),
		defaultValues: {
			addressSearch: safeString(property.address),
			address: safeString(property.address),
			city: safeString(property.city),
			region: safeString(property.region),
			country: safeString(property.country),
			latitude: undefined,
			longitude: undefined,
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
			propertyId: property.id,
			data: {
				address: data.address,
				city: data.city,
				region: data.region,
				country: data.country,
				latitude: data.latitude,
				longitude: data.longitude,
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm rounded-xl">
				<DialogHeader>
					<DialogTitle>Edit Location</DialogTitle>
					<DialogDescription>
						Search and select an address to update location details.
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
// Main module
// ---------------------------------------------------------------------------

export function PropertyGeneralSettingsModule() {
	const { clientUserProperty } = useProperty()
		const queryClient = useQueryClient()

	const [openDeletePropertyModal, setOpenDeletePropertyModal] = useState(false)
	const [showEditBasic, setShowEditBasic] = useState(false)
	const [showEditLocation, setShowEditLocation] = useState(false)

	const property = clientUserProperty?.property

	const handleMutationSuccess = () => {
				void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENT_USER_PROPERTIES] })
	}

	return (
		<div className="mx-auto max-w-4xl space-y-8 px-0 pt-0 pb-10 lg:px-4 lg:pt-1">
			<div className="space-y-1">
				<TypographyH3>General Settings</TypographyH3>
				<TypographyMuted>
					Update and manage your essential information.
				</TypographyMuted>
			</div>

			<Separator />

			{/* Basic Property Details */}
			<section className="bg-card relative grid gap-8 rounded-xl border p-4 shadow-sm sm:grid-cols-3 sm:items-start md:p-6">
				<PropertyPermissionGuard roles={['MANAGER']}>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="absolute top-3 right-3 gap-1.5 text-xs"
						onClick={() => setShowEditBasic(true)}
					>
						<Pencil className="size-3.5" />
						Edit
					</Button>
				</PropertyPermissionGuard>

				<div className="space-y-2">
					<TypographyH4 className="text-lg font-semibold">
						Basic Details
					</TypographyH4>
					<TypographyMuted className="text-sm">
						The property name, description, and type.
					</TypographyMuted>
				</div>

				<div className="space-y-5 sm:col-span-2">
					<div className="space-y-1">
						<Label className="text-sm font-medium">Property Name</Label>
						<p className="text-foreground text-sm">
							{safeString(property?.name) || '—'}
						</p>
					</div>

					<div className="space-y-1">
						<Label className="text-sm font-medium">Description</Label>
						<p className="text-muted-foreground text-sm">
							{safeString(property?.description) || '—'}
						</p>
					</div>

					<div className="space-y-1">
						<Label className="text-sm font-medium">Type</Label>
						<p className="text-muted-foreground text-sm">
							{property?.type
								? property.type.charAt(0) + property.type.slice(1).toLowerCase()
								: '—'}
						</p>
					</div>
				</div>
			</section>

			{/* Location */}
			<section className="bg-card relative grid gap-8 rounded-xl border p-4 shadow-sm sm:grid-cols-3 sm:items-start md:p-6">
				<PropertyPermissionGuard roles={['MANAGER']}>
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
				</PropertyPermissionGuard>

				<div className="space-y-2">
					<TypographyH4 className="text-lg font-semibold">Location</TypographyH4>
					<TypographyMuted className="text-sm">
						Changing the address updates country, region, and city automatically.
					</TypographyMuted>
				</div>

				<div className="space-y-5 sm:col-span-2">
					<div className="space-y-1">
						<Label className="text-sm font-medium">Address</Label>
						<p className="text-muted-foreground text-sm">
							{safeString(property?.address) || '—'}
						</p>
					</div>

					<div className="grid gap-5 sm:grid-cols-3">
						<div className="space-y-1">
							<Label className="text-sm font-medium">Country</Label>
							<p className="text-muted-foreground text-sm">
								{safeString(property?.country) || '—'}
							</p>
						</div>
						<div className="space-y-1">
							<Label className="text-sm font-medium">Region</Label>
							<p className="text-muted-foreground text-sm">
								{safeString(property?.region) || '—'}
							</p>
						</div>
						<div className="space-y-1">
							<Label className="text-sm font-medium">City</Label>
							<p className="text-muted-foreground text-sm">
								{safeString(property?.city) || '—'}
							</p>
						</div>
					</div>
				</div>
			</section>
 
			{/* Support Access */}
			{/* <section className="bg-card grid gap-6 rounded-xl border p-4 shadow-sm md:p-6">
				<TypographyH3>Support Access</TypographyH3>
				<Separator />

				<div className="flex items-center justify-between">
					<Field>
						<FieldLabel htmlFor="support_access">Support Access</FieldLabel>
						<FieldDescription>
							Allow support agents to access this property to help troubleshoot
							issues.
						</FieldDescription>
					</Field>
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Switch id="support_access" />
					</PropertyPermissionGuard>
				</div>

				<PermissionGuard roles={['OWNER']}>
					<div className="flex items-center justify-between">
						<Field>
							<FieldLabel htmlFor="delete_property" className="text-rose-600">
								Delete Property
							</FieldLabel>
							<FieldDescription>
								Permanently delete this property and all associated data.
							</FieldDescription>
						</Field>
						<Button
							size="sm"
							variant="secondary"
							onClick={() => setOpenDeletePropertyModal(true)}
						>
							Delete Property
						</Button>
					</div>
				</PermissionGuard>
			</section> */}

			{/* ------------------------------------------------------------------ */}
			{/* Dialogs                                                              */}
			{/* ------------------------------------------------------------------ */}

			{property && (
				<EditBasicDetailsDialog
					property={property}
					open={showEditBasic}
					onOpenChange={setShowEditBasic}
					onSuccess={() => {
						setShowEditBasic(false)
						handleMutationSuccess()
					}}
				/>
			)}

			{property && (
				<EditLocationDialog
					property={property}
					open={showEditLocation}
					onOpenChange={setShowEditLocation}
					onSuccess={() => {
						setShowEditLocation(false)
						handleMutationSuccess()
					}}
				/>
			)}

			<ConfirmDeletePropertyModule
				opened={openDeletePropertyModal}
				setOpened={setOpenDeletePropertyModal}
				data={clientUserProperty?.property ?? undefined}
			/>
		</div>
	)
}
