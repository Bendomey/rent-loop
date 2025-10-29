import { zodResolver } from '@hookform/resolvers/zod'
import { CircleUserRound, DoorClosed, Home } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { useApplyContext } from './context'
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

const ValidationSchema = z
	.object({
		type: z.enum(['INDIVIDUAL', 'COMPANY'], {
			error: 'Please select a type',
		}),
		sub_type: z
			.enum(['LANDLORD', 'PROPERTY_MANAGER', 'DEVELOPER', 'AGENCY'], {
				error: 'Please select a sub type',
			})
			.optional()
			.nullable(),
	})
	.superRefine((data, ctx) => {
		if (data.type === 'COMPANY') {
			if (!data.sub_type || data.sub_type === 'LANDLORD') {
				ctx.addIssue({
					code: 'custom',
					message: 'Please select a sub type',
					path: ['sub_type'],
				})
			}
		}
	})

type FormSchema = z.infer<typeof ValidationSchema>

const models = [
	{
		type: 'INDIVIDUAL',
		name: 'Individual',
		description: 'Owns and rents out their own properties.',
		image:
			'https://images.unsplash.com/photo-1650804068570-7fb2e3dbf888?q=80&w=640&auto=format&fit=crop',
		credit: 'Valeria Reverdo on Unsplash',
		icon: CircleUserRound,
	},
	{
		type: 'COMPANY',
		name: 'Company',
		description: 'Manages properties on behalf of owners.',
		image:
			'https://images.unsplash.com/photo-1610280777472-54133d004c8c?q=80&w=640&auto=format&fit=crop',
		credit: 'Michael Oeser on Unsplash',
		icon: DoorClosed,
	},
]

const subTypes: Array<{ label: string; value: ClientApplication['sub_type'] }> =
	[
		{ label: 'Property Manager', value: 'PROPERTY_MANAGER' },
		{ label: 'Developer', value: 'DEVELOPER' },
		{ label: 'Agency', value: 'AGENCY' },
	]

export function Step0() {
	const { watch, setValue, formState, handleSubmit } = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})
	const { goNext, updateFormData, formData } = useApplyContext()

	useEffect(() => {
		if (formData.type) {
			setValue('type', formData.type, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.sub_type) {
			setValue('sub_type', formData.sub_type, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const onSubmit = async (data: FormSchema) => {
		let subType = data.sub_type ?? undefined
		if (data.type === 'INDIVIDUAL') {
			subType = 'LANDLORD'
		}

		updateFormData({
			type: data.type,
			sub_type: subType,
		})
		goNext()
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="mx-auto mb-5 space-y-10 md:max-w-2/3"
		>
			<div className="space-y-2">
				<TypographyH2 className="">
					What type of Property Owner are you?
				</TypographyH2>
				<TypographyMuted className="">
					This will help us setup your account to handle your properties more
					effectively.
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
									setValue('type', model.type as ClientApplication['type'], {
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

				{watch('type') === 'COMPANY' ? (
					<div className="mt-5">
						<TypographyMuted>Sub Type</TypographyMuted>
						<div className="mt-3 flex space-x-3">
							{subTypes.map((subType) => {
								const isSelected = watch('sub_type') === subType.value

								return (
									<Button
										type="button"
										onClick={() =>
											setValue('sub_type', subType.value, {
												shouldDirty: true,
												shouldValidate: true,
											})
										}
										key={subType.value}
										variant={isSelected ? 'default' : 'outline'}
										className={cn(
											isSelected
												? 'bg-zinc-900 text-white hover:bg-zinc-800'
												: '',
										)}
									>
										{subType.label}
									</Button>
								)
							})}
						</div>
						{formState.errors?.sub_type ? (
							<TypographySmall className="text-destructive mt-3">
								{formState.errors.sub_type.message}
							</TypographySmall>
						) : null}
					</div>
				) : null}
			</div>

			<div className="mt-10 flex items-center justify-end space-x-5">
				<Link to="/login">
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
