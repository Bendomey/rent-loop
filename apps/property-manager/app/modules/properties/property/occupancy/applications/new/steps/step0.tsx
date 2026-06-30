import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Check, Home, Link as LinkIcon, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLoaderData } from 'react-router'
import { z } from 'zod'
import { useCreatePropertyTenantApplicationContext } from '../context'
import InviteTenantModal from '../invite'
import { UnitSelect } from '~/components/SingleSelect/unit-select'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
} from '~/components/ui/item'
import { Label } from '~/components/ui/label'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import type { loader } from '~/routes/_auth.properties.$propertyId.settings.billing'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { InternationalPhoneInput } from '~/components/international-phone'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { useGetTenantByPhone } from '~/api/tenants'
import { Spinner } from '~/components/ui/spinner'

const ValidationSchema = z
	.object({
		desired_unit_id: z.string({
			error: 'Please select a unit',
		}),
		desired_unit: z.string(),
		on_boarding_method: z.enum(['SELF', 'ADMIN'], {
			error: 'Please select an onboarding method',
		}),
		phone: z
			.string()
			.optional()
			.refine((val) => !val || isValidPhoneNumber(val), {
				message: 'Please enter a valid phone number',
			}),
	})
	.refine(
		(data) => data.on_boarding_method !== 'ADMIN' || !!data.phone?.trim(),
		{
			message: 'Phone number is required for admin onboarding',
			path: ['phone'],
		},
	)

type FormSchema = z.infer<typeof ValidationSchema>

const onboardingOptions = [
	{
		value: 'SELF',
		name: 'Self Onboarding',
		description:
			'Generate a link for the tenant to complete their own onboarding.',
		icon: LinkIcon,
	},
	{
		value: 'ADMIN',
		name: 'Admin Onboarding',
		description: 'You will guide the tenant through the onboarding process.',
		icon: Shield,
	},
]

export function Step0() {
	const { clientUserProperty } = useLoaderData<typeof loader>()
	const property_id = safeString(clientUserProperty?.property?.id)
	const admin_id = safeString(clientUserProperty?.client_user_id)

	const [openInviteTenantModal, setOpenInviteTenantModal] = useState(false)

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			on_boarding_method: 'SELF',
		},
	})

	const { watch, setValue, formState, handleSubmit, control } = rhfMethods

	const { goNext, goToPage, setTenantExists, updateFormData, formData } =
		useCreatePropertyTenantApplicationContext()

	const { mutate: getTenantMutate, isPending } = useGetTenantByPhone()

	useEffect(() => {
		if (formData.desired_unit_id) {
			setValue('desired_unit_id', formData.desired_unit_id, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.on_boarding_method) {
			setValue(
				'on_boarding_method',
				formData.on_boarding_method as 'SELF' | 'ADMIN',
				{
					shouldDirty: true,
					shouldValidate: true,
				},
			)
		}
		if (formData.desired_unit) {
			setValue('desired_unit', formData.desired_unit, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.phone) {
			setValue('phone', formData.phone, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
	}, [formData, setValue])

	const isSelfOnboarding = watch('on_boarding_method') === 'SELF'

	const onSubmit = async (data: FormSchema) => {
		updateFormData({
			property_id,
			desired_unit_id: data.desired_unit_id,
			desired_unit: data.desired_unit,
			on_boarding_method: data.on_boarding_method,
			phone: data.phone,
		})

		if (isSelfOnboarding) {
			// Submit the entire form for self-onboarding
			setOpenInviteTenantModal(true)
		} else {
			// Move to next step for admin onboarding
			getTenantMutate(data.phone, {
				onError: () => {
					goNext()
				},
				onSuccess: (tenant) => {
					if (!tenant) {
						goNext()
						return
					}
					setTenantExists(true)
					updateFormData({
						// step1 data
						first_name: tenant.first_name,
						other_names: tenant.other_names,
						last_name: tenant.last_name,
						email: tenant.email,
						phone: tenant.phone,
						current_address: tenant.current_address,
						profile_photo_url: tenant.profile_photo_url,
						date_of_birth: tenant.date_of_birth?.toString(),
						gender: tenant.gender,
						marital_status: tenant.marital_status ?? undefined,

						// step2 data
						nationality: tenant.nationality ?? undefined,
						id_type: tenant.id_type,
						id_number: tenant.id_number ?? undefined,
						id_front_url: tenant.id_front_url,
						id_back_url: tenant.id_back_url,

						// step3 data
						emergency_contact_name: tenant.emergency_contact_name ?? undefined,
						relationship_to_emergency_contact:
							tenant.relationship_to_emergency_contact ?? undefined,
						emergency_contact_phone:
							tenant.emergency_contact_phone ?? undefined,
						employer_type:
							tenant.occupation === 'STUDENT' ? 'STUDENT' : 'WORKER',
						occupation: tenant.occupation ?? undefined,
						employer: tenant.employer ?? undefined,
						occupation_address: tenant.occupation_address ?? undefined,
						proof_of_income_url: tenant.proof_of_income_url,
					})
					goToPage(4)
				},
			})
		}
	}

	const isLoading = !isSelfOnboarding && isPending

	return (
		<>
			<Form {...rhfMethods}>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="mx-auto mb-10 space-y-8 md:max-w-2xl"
				>
					{/* Header Section */}
					<div className="mt-10 space-y-2 border-b pb-6">
						<TypographyH2 className="text-2xl font-bold">
							Add New Rental Application
						</TypographyH2>
						<TypographyMuted className="text-base">
							Select an available unit and choose how the tenant should be
							onboarded.
						</TypographyMuted>
					</div>

					{/* Unit Selection Section */}
					<div className="space-y-4 rounded-lg border bg-zinc-50 p-6 dark:bg-zinc-900">
						<div className="space-y-2">
							<Label className="text-base font-semibold">Select Unit</Label>
							<TypographyMuted>
								Choose which unit this lease application is for.
							</TypographyMuted>
						</div>

						<UnitSelect
							label=""
							property_id={property_id}
							value={watch('desired_unit_id')}
							onChange={({ id, name }) => {
								setValue('desired_unit_id', id, {
									shouldDirty: true,
									shouldValidate: true,
								})
								setValue('desired_unit', name)
							}}
						/>
						<Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
							<AlertDescription className="!block text-sm">
								Only units with an <strong>Available</strong> status can be
								selected. Units that are <strong>Occupied</strong> or in{' '}
								<strong>Draft</strong> are not eligible for a new application.{' '}
								<Link
									to={`/properties/${property_id}/assets/units`}
									className="underline underline-offset-2"
								>
									Manage units
								</Link>
							</AlertDescription>
						</Alert>
						{formState.errors?.desired_unit_id ? (
							<TypographySmall className="text-destructive">
								{formState.errors.desired_unit_id.message}
							</TypographySmall>
						) : null}
					</div>

					{/* Onboarding Method Selection */}
					<div className="space-y-4">
						<div className="space-y-2">
							<Label className="text-base font-semibold">
								How should the tenant be onboarded?
							</Label>
							<TypographyMuted>
								Choose the onboarding method that works best for this tenant.
							</TypographyMuted>
						</div>

						<ItemGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{onboardingOptions.map((option) => {
								const isSelected = watch('on_boarding_method') === option.value

								return (
									<Item
										key={option.value}
										variant="outline"
										className={cn(
											'relative cursor-pointer transition-all duration-200 hover:shadow-md',
											isSelected
												? 'border-2 border-rose-600 bg-rose-50 dark:bg-rose-950/40'
												: 'hover:bg-zinc-50 dark:hover:bg-zinc-800',
										)}
										onClick={() =>
											setValue(
												'on_boarding_method',
												option.value as 'SELF' | 'ADMIN',
												{
													shouldDirty: true,
													shouldValidate: true,
												},
											)
										}
									>
										<ItemContent className="flex gap-4">
											<div className="flex-shrink-0 pt-1">
												<div
													className={cn(
														'rounded-lg p-2',
														isSelected
															? 'bg-rose-100 dark:bg-rose-900/50'
															: 'bg-zinc-100 dark:bg-zinc-800',
													)}
												>
													<option.icon
														className={cn(
															'size-6',
															isSelected
																? 'text-rose-600'
																: 'text-zinc-600 dark:text-zinc-400',
														)}
													/>
												</div>
											</div>
											<div className="flex-1 space-y-1">
												<ItemDescription className="text-foreground font-semibold">
													{option.name}
												</ItemDescription>
												<ItemDescription className="text-sm leading-relaxed">
													{option.description}
												</ItemDescription>
											</div>
											{isSelected && (
												<>
													<div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600">
														<Check className="h-4 w-4 text-white" />
													</div>
												</>
											)}
										</ItemContent>
									</Item>
								)
							})}
						</ItemGroup>

						{formState.errors?.on_boarding_method ? (
							<TypographySmall className="text-destructive">
								{formState.errors.on_boarding_method.message}
							</TypographySmall>
						) : null}
					</div>
					{!isSelfOnboarding && (
						<div className="space-y-2 rounded-lg border bg-zinc-50 p-6 dark:bg-zinc-900">
							<TypographyMuted>
								We'll check if this tenant already exists in your system to
								speed up onboarding.
							</TypographyMuted>

							<FormField
								control={control}
								name="phone"
								render={({ field, fieldState }) => (
									<FormItem>
										<FormLabel>Tenant phone number</FormLabel>
										<FormControl>
											<InternationalPhoneInput
												value={field.value}
												onChange={field.onChange}
												error={!!fieldState.error}
											/>
										</FormControl>
										<FormMessage />
										<FormDescription>
											Enter the phone number in international format, e.g.{' '}
											<span className="font-medium">+233 201 234 567</span>.
										</FormDescription>
									</FormItem>
								)}
							/>
						</div>
					)}
					<div className="mt-10 flex items-center justify-between space-x-5 border-t pt-6">
						<Link to={`/properties/${property_id}/occupancy/applications`}>
							<Button type="button" size="lg" variant="outline">
								<Home className="mr-2 h-4 w-4" />
								Go Back
							</Button>
						</Link>
						<Button
							disabled={!formState.isDirty || isLoading}
							size="lg"
							variant="default"
							className="bg-rose-600 hover:bg-rose-700"
						>
							{isLoading ? <Spinner /> : null}
							Next <ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</div>
				</form>
			</Form>
			<InviteTenantModal
				opened={openInviteTenantModal}
				setOpened={setOpenInviteTenantModal}
				data={{
					email: formData.email,
					phone: formData.phone,
					desired_unit: {
						id: watch('desired_unit_id'),
						name: watch('desired_unit'),
					},
				}}
				admin_id={admin_id}
			/>
		</>
	)
}
