import { zodResolver } from '@hookform/resolvers/zod'
import { Briefcase, Building2, Home, LayoutGrid, Store } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLoaderData } from 'react-router'
import { z } from 'zod'
import { useCreatePropertyUnitContext } from '../context'
import { BlockSelect } from '~/components/SingleSelect/block-select'
import { Button } from '~/components/ui/button'
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemHeader,
	ItemTitle,
} from '~/components/ui/item'
import { Label } from '~/components/ui/label'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import type { loader } from '~/routes/_auth.properties.$propertyId.assets.units.new'

const ValidationSchema = z.object({
	type: z.enum(['APARTMENT', 'HOUSE', 'STUDIO', 'OFFICE', 'RETAIL'], {
		error: 'Please select a type',
	}),
	status: z.enum(
		[
			'Unit.Status.Draft',
			'Unit.Status.Available',
			'Unit.Status.Occupied',
			'Unit.Status.Maintenance',
		],
		{
			error: 'Please select a status',
		},
	),
	property_block_id: z
		.string()
		.optional()
		.refine(Boolean, { message: 'Please select a block' }),
	block: z.string(),
})

type FormSchema = z.infer<typeof ValidationSchema>

const models = [
	{
		type: 'APARTMENT',
		name: 'Apartment',
		description: 'A self-contained housing unit within a building.',
		icon: Building2,
	},
	{
		type: 'HOUSE',
		name: 'House',
		description: 'A standalone residential building.',
		icon: Home,
	},
	{
		type: 'STUDIO',
		name: 'Studio',
		description: 'A compact, single-room living space.',
		icon: LayoutGrid,
	},
	{
		type: 'OFFICE',
		name: 'Office',
		description: 'A space for professional or business use.',
		icon: Briefcase,
	},
	{
		type: 'RETAIL',
		name: 'Retail',
		description: 'A space for selling goods or services.',
		icon: Store,
	},
]

const status: Array<{ label: string; value: PropertyUnit['status'] }> = [
	{ label: 'Draft', value: 'Unit.Status.Draft' },
	{ label: 'Available', value: 'Unit.Status.Available' },
	{ label: 'Occupied', value: 'Unit.Status.Occupied' },
	{ label: 'Maintenance', value: 'Unit.Status.Maintenance' },
]

export function Step0() {
	const { clientUserProperty } = useLoaderData<typeof loader>()
	const property_id = safeString(clientUserProperty?.property?.id)

	const { watch, setValue, formState, handleSubmit } = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			status: 'Unit.Status.Draft',
		},
	})

	const { goNext, updateFormData, formData } = useCreatePropertyUnitContext()

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
		if (formData.property_block_id) {
			setValue('property_block_id', formData.property_block_id, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.block) {
			setValue('block', formData.block, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
	}, [formData, setValue])

	const onSubmit = async (data: FormSchema) => {
		updateFormData({
			property_id,
			type: data.type,
			status: data.status,
			property_block_id: data.property_block_id,
			block: data.block,
		})
		goNext()
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="mx-auto mt-5 md:max-w-2/3"
		>
			<TypographyH2>Add New Property Unit</TypographyH2>
			<TypographyMuted>
				We break down properties into units to better organize and manage rental
				spaces.
			</TypographyMuted>

			<div className="mt-5 space-y-8">
				<div className="">
					<BlockSelect
						property_id={property_id}
						value={watch('property_block_id')}
						onChange={({ id, name }) => {
							setValue('property_block_id', id, {
								shouldDirty: true,
								shouldValidate: true,
							})
							setValue('block', name)
						}}
					/>
					{formState.errors?.property_block_id ? (
						<TypographySmall className="text-destructive">
							{formState.errors.property_block_id.message}
						</TypographySmall>
					) : null}
				</div>

				<div>
					<div className="mb-2 space-y-2">
						<Label>Type</Label>
						<TypographyMuted className="">
							Choose the category that best matches your property unit's layout
							or use.
						</TypographyMuted>
					</div>
					<ItemGroup className="grid grid-cols-3 gap-4">
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
										setValue('type', model.type as PropertyUnit['type'], {
											shouldDirty: true,
											shouldValidate: true,
										})
									}
								>
									<ItemHeader className="flex items-center justify-center">
										<model.icon className="size-16" />
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
							<TypographySmall className="text-destructive">
								{formState.errors.type.message}
							</TypographySmall>
						) : null}
					</ItemGroup>
				</div>

				<div className="">
					<Label>Status</Label>
					<div className="mt-3 flex space-x-3">
						{status.map((status) => {
							const isSelected = watch('status') === status.value
							return (
								<Button
									type="button"
									onClick={() =>
										setValue('status', status.value, {
											shouldDirty: true,
											shouldValidate: true,
										})
									}
									key={status.value}
									variant={isSelected ? 'default' : 'outline'}
									className={cn({ 'bg-rose-600 text-white': isSelected })}
								>
									{status.label}
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
			</div>

			<div className="mt-14 flex items-center justify-end space-x-5">
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
