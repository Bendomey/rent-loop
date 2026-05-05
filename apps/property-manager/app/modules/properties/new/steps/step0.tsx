import { zodResolver } from '@hookform/resolvers/zod'
import { Building, ClipboardList, Home, Hotel } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { useCreatePropertyContext } from '../context'
import { Button } from '~/components/ui/button'
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemHeader,
	ItemTitle,
} from '~/components/ui/item'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { ASSET_MANAGEMENT_GUIDE_URL } from '~/lib/constants'
import { cn } from '~/lib/utils'

const ValidationSchema = z.object({
	type: z.enum(['SINGLE', 'MULTI'], {
		error: 'Please select a type',
	}),
	status: z.enum(
		[
			'Property.Status.Active',
			'Property.Status.Maintenance',
			'Property.Status.Inactive',
		],
		{ error: 'Please select a status' },
	),
	modeSelection: z.enum(['LEASE', 'BOOKING', 'BOTH'], {
		error: 'Please select a rental mode',
	}),
})

type FormSchema = z.infer<typeof ValidationSchema>

const models = [
	{
		type: 'SINGLE',
		name: 'Single Unit',
		description: 'A complete housing space rented by one family or tenant.',
		icon: Home,
	},
	{
		type: 'MULTI',
		name: 'Multi-Unit',
		description:
			'A property divided into separate spaces rented by multiple tenants.',
		icon: Building,
	},
]

const statusOptions: Array<{ label: string; value: Property['status'] }> = [
	{ label: 'Active', value: 'Property.Status.Active' },
	{ label: 'Inactive', value: 'Property.Status.Inactive' },
	{ label: 'Maintenance', value: 'Property.Status.Maintenance' },
]

const modeOptions: Array<{
	value: 'LEASE' | 'BOOKING' | 'BOTH'
	name: string
	description: string
	icon: React.ElementType
}> = [
	{
		value: 'LEASE',
		name: 'Long-term (Leases)',
		description: 'Monthly rent, tenant applications, lease agreements.',
		icon: ClipboardList,
	},
	{
		value: 'BOOKING',
		name: 'Short-term (Bookings)',
		description:
			'Nightly/daily stays, guest booking link, availability calendar.',
		icon: Hotel,
	},
	{
		value: 'BOTH',
		name: 'Both',
		description: 'Some units long-term, others available for short stays.',
		icon: Building,
	},
]

export function Step0() {
	const { watch, setValue, formState, handleSubmit } = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			status: 'Property.Status.Active',
		},
	})

	const { goNext, updateFormData, formData } = useCreatePropertyContext()

	useEffect(() => {
		if (formData.type) {
			setValue('type', formData.type, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.status) {
			setValue('status', formData.status, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.modes) {
			const modeSelection =
				formData.modes.includes('LEASE') && formData.modes.includes('BOOKING')
					? 'BOTH'
					: formData.modes.includes('BOOKING')
						? 'BOOKING'
						: 'LEASE'
			setValue('modeSelection', modeSelection, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const onSubmit = (data: FormSchema) => {
		const modes: Array<'LEASE' | 'BOOKING'> =
			data.modeSelection === 'BOTH'
				? ['LEASE', 'BOOKING']
				: [data.modeSelection]
		updateFormData({ type: data.type, status: data.status, modes })
		goNext()
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="mx-auto mb-5 space-y-10 md:max-w-2/3"
		>
			<div className="space-y-2">
				<TypographyH2>What type of Property is this?</TypographyH2>
				<TypographyMuted>
					Choose the category that best matches your property's layout or use.
				</TypographyMuted>
				<p className="text-muted-foreground text-xs">
					Not sure which to choose?{' '}
					<a
						href={`${ASSET_MANAGEMENT_GUIDE_URL}#two-types-of-properties`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-rose-600 hover:underline"
					>
						Learn about property types
					</a>
				</p>
			</div>

			<div className="space-y-6">
				{/* Type selection */}
				<ItemGroup className="grid grid-cols-2 gap-4">
					{models.map((model) => {
						const isSelected = watch('type') === model.type
						return (
							<Item
								key={model.name}
								variant="outline"
								className={cn(
									'cursor-pointer hover:bg-zinc-100',
									isSelected ? 'border-1 border-rose-600' : '',
								)}
								onClick={() =>
									setValue('type', model.type as Property['type'], {
										shouldDirty: true,
										shouldValidate: true,
									})
								}
							>
								<ItemHeader className="flex items-center justify-center">
									<model.icon className="size-20" />
								</ItemHeader>
								<ItemContent className="flex items-center justify-center">
									<ItemTitle>{model.name}</ItemTitle>
									<ItemDescription className="text-center">
										{model.description}
									</ItemDescription>
								</ItemContent>
							</Item>
						)
					})}
					{formState.errors?.type ? (
						<TypographySmall className="text-destructive col-span-2">
							{formState.errors.type.message}
						</TypographySmall>
					) : null}
				</ItemGroup>

				{/* Status */}
				<div>
					<TypographyMuted>Status</TypographyMuted>
					<div className="mt-3 flex space-x-3">
						{statusOptions.map((s) => {
							const isSelected = watch('status') === s.value
							return (
								<Button
									type="button"
									onClick={() =>
										setValue('status', s.value, {
											shouldDirty: true,
											shouldValidate: true,
										})
									}
									key={s.value}
									variant={isSelected ? 'default' : 'outline'}
									className={cn({ 'bg-rose-600 text-white': isSelected })}
								>
									{s.label}
								</Button>
							)
						})}
					</div>
					{formState.errors?.status ? (
						<TypographySmall className="text-destructive mt-3">
							{formState.errors.status.message}
						</TypographySmall>
					) : null}
				</div>

				{/* Mode selection */}
				<div className="space-y-2">
					<TypographyMuted>
						What type of rentals does this property handle?
					</TypographyMuted>
					<ItemGroup className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						{modeOptions.map((mode) => {
							const isSelected = watch('modeSelection') === mode.value
							return (
								<Item
									key={mode.value}
									variant="outline"
									className={cn(
										'cursor-pointer hover:bg-zinc-100',
										isSelected ? 'border-1 border-rose-600' : '',
									)}
									onClick={() =>
										setValue('modeSelection', mode.value, {
											shouldDirty: true,
											shouldValidate: true,
										})
									}
								>
									<ItemHeader className="flex items-center justify-center">
										<mode.icon className="size-10" />
									</ItemHeader>
									<ItemContent className="flex items-center justify-center">
										<ItemTitle className="text-center text-sm">
											{mode.name}
										</ItemTitle>
										<ItemDescription className="text-center text-xs">
											{mode.description}
										</ItemDescription>
									</ItemContent>
								</Item>
							)
						})}
					</ItemGroup>
					{formState.errors?.modeSelection ? (
						<TypographySmall className="text-destructive">
							{formState.errors.modeSelection.message}
						</TypographySmall>
					) : null}
				</div>
			</div>

			<div className="mt-10 flex items-center justify-end space-x-5">
				<Link to="/properties">
					<Button type="button" size="sm" variant="ghost">
						<Home />
						Go Home
					</Button>
				</Link>
				<Button
					disabled={!formState.isDirty}
					size="lg"
					variant="default"
					className="bg-rose-600 hover:bg-rose-700"
				>
					Next
				</Button>
			</div>
		</form>
	)
}
