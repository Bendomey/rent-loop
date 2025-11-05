import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreatePropertyContext } from '../context'
import { AddressInput, AddressSchema } from '~/components/address-input'
import { Button } from '~/components/ui/button'
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
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

const ValidationSchema = z
	.object({
		gps_address: z.string().optional(),
	})
	.and(AddressSchema)

type FormSchema = z.infer<typeof ValidationSchema>

export function Step2() {
	const { goBack, goNext, formData, updateFormData } =
		useCreatePropertyContext()
	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})

	const { control, handleSubmit, formState, setValue } = rhfMethods

	useEffect(() => {
		if (formData.gps_address) {
			setValue('gps_address', formData.gps_address, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.address) {
			setValue('addressSearch', formData.address, {
				shouldDirty: true,
				shouldValidate: true,
			})

			setValue('address', formData.address, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.latitude) {
			setValue('latitude', formData.latitude, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.longitude) {
			setValue('longitude', formData.longitude, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.city) {
			setValue('city', formData.city, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.region) {
			setValue('region', formData.region, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.country) {
			setValue('country', formData.country, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const onSubmit = async (data: FormSchema) => {
		updateFormData(data)
		goNext()
	}

	const isAddressInvalid =
		!!formState.errors.addressSearch ||
		!!formState.errors.address ||
		!!formState.errors.city ||
		!!formState.errors.region ||
		!!formState.errors.country ||
		!!formState.errors.latitude ||
		!!formState.errors.longitude

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto mb-5 space-y-10 md:max-w-2/3"
			>
				<div className="space-y-2">
					<TypographyH2 className="">Address Information</TypographyH2>
					<TypographyMuted className="">Where are you located?</TypographyMuted>
				</div>

				<FieldGroup>
					<Field data-invalid={isAddressInvalid}>
						<FieldLabel htmlFor="name">Address</FieldLabel>
						<AddressInput />
						{isAddressInvalid ? (
							<FieldError
								errors={[{ message: 'Kindly select a location from the list' }]}
							/>
						) : null}
					</Field>

					<FormField
						name="gps_address"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>GPS Address</FormLabel>
								<FormControl>
									<Input
										type="text"
										{...field}
										placeholder="Enter your GPS address (e.g., GM-123-4567)"
									/>
								</FormControl>
								<FormMessage />
								<FormDescription>Optional</FormDescription>
							</FormItem>
						)}
					/>
				</FieldGroup>

				<div className="mt-10 flex items-center justify-end space-x-5">
					<Button onClick={goBack} type="button" size="sm" variant="ghost">
						<ArrowLeft />
						Go Back
					</Button>
					<Button
						size="lg"
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						Next
					</Button>
				</div>
			</form>
		</Form>
	)
}
