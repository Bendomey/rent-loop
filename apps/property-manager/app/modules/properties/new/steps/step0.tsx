import { zodResolver } from '@hookform/resolvers/zod'
import { Building, Home } from 'lucide-react'
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
		{
			error: 'Please select a status',
		},
	),
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

const status: Array<{ label: string; value: Property['status'] }> = [
	{ label: 'Active', value: 'Property.Status.Active' },
	{ label: 'Inactive', value: 'Property.Status.Inactive' },
	{ label: 'Maintenance', value: 'Property.Status.Maintenance' },
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const onSubmit = async (data: FormSchema) => {
		updateFormData({
			type: data.type,
			status: data.status,
		})
		goNext()
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="mx-auto mb-5 space-y-10 md:max-w-2/3"
		>
			<div className="space-y-2">
				<TypographyH2 className="">What type of Property is this?</TypographyH2>
				<TypographyMuted className="">
					Choose the category that best matches your property's layout or use.
				</TypographyMuted>
			</div>

			<div>
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
						<TypographySmall className="text-destructive">
							{formState.errors.type.message}
						</TypographySmall>
					) : null}
				</ItemGroup>

				<div className="mt-5">
					<TypographyMuted>Status</TypographyMuted>
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
