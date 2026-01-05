import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Check, Home, Link as LinkIcon, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLoaderData } from 'react-router'
import { z } from 'zod'
import { useCreatePropertyTenantApplicationContext } from '../context'
import InviteTenantModal from '../invite'
import { UnitSelect } from '~/components/SingleSelect/unit-select'
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

const ValidationSchema = z.object({
	desired_unit_id: z.string({
		error: 'Please select a unit',
	}),
	desired_unit: z.string(),
	on_boarding_method: z.enum(['SELF', 'ADMIN'], {
		error: 'Please select an onboarding method',
	}),
})

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

	const [openInviteTenantModal, setOpenInviteTenantModal] = useState(false)

	const { watch, setValue, formState, handleSubmit } = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			on_boarding_method: 'SELF',
		},
	})

	const { goNext, updateFormData, formData } =
		useCreatePropertyTenantApplicationContext()

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
	}, [formData, setValue])

	const isSelfOnboarding = watch('on_boarding_method') === 'SELF'

	const onSubmit = async (data: FormSchema) => {
		updateFormData({
			property_id,
			desired_unit_id: data.desired_unit_id,
			desired_unit: data.desired_unit,
			on_boarding_method: data.on_boarding_method,
		})

		if (isSelfOnboarding) {
			// Submit the entire form for self-onboarding
			setOpenInviteTenantModal(true)
		} else {
			// Move to next step for admin onboarding
			goNext()
		}
	}

	return (
		<>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto mb-10 space-y-8 md:max-w-2xl"
			>
				{/* Header Section */}
				<div className="space-y-2 border-b pb-6">
					<TypographyH2 className="text-2xl font-bold">
						Add New Property Tenant
					</TypographyH2>
					<TypographyMuted className="text-base">
						Select an available unit and choose how the tenant should be
						onboarded.
					</TypographyMuted>
				</div>

				{/* Unit Selection Section */}
				<div className="space-y-4 rounded-lg border bg-slate-50 p-6">
					<div className="space-y-2">
						<Label className="text-base font-semibold">Select Unit</Label>
						<TypographyMuted>
							Choose which unit this tenant application is for.
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
											? 'border-2 border-rose-600 bg-rose-50'
											: 'hover:bg-slate-50',
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
													isSelected ? 'bg-rose-100' : 'bg-slate-100',
												)}
											>
												<option.icon
													className={cn(
														'size-6',
														isSelected ? 'text-rose-600' : 'text-slate-600',
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
				<div className="mt-10 flex items-center justify-between space-x-5 border-t pt-6">
					<Link to={`/properties/${property_id}/tenants/applications`}>
						<Button type="button" size="lg" variant="outline">
							<Home className="mr-2 h-4 w-4" />
							Go Back
						</Button>
					</Link>
					<Button
						disabled={!formState.isDirty}
						size="lg"
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						Next <ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</form>

			<InviteTenantModal
				opened={openInviteTenantModal}
				setOpened={setOpenInviteTenantModal}
				data={formData}
				property_id={property_id}
			/>
		</>
	)
}
