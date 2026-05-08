import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useNewPMContext } from './context'
import { Button } from '~/components/ui/button'
import { FieldGroup } from '~/components/ui/field'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

const ValidationSchema = z.object({
	type: z.enum(['INDIVIDUAL', 'COMPANY'], {
		error: 'Please select a type',
	}),
	address: z.string().min(2, 'Address is required'),
	city: z.string().min(1, 'City is required'),
	region: z.string().min(1, 'Region is required'),
	country: z.string().min(1, 'Country is required'),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function Step2() {
	const { goBack, goNext, formData, updateFormData } = useNewPMContext()
	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			type: formData.type,
			address: formData.address ?? '',
			city: formData.city ?? '',
			region: formData.region ?? '',
			country: formData.country ?? 'Ghana',
		},
	})

	const { watch, handleSubmit, control } = rhfMethods
	const isIndividual = watch('type') === 'INDIVIDUAL'

	const onSubmit = (data: FormSchema) => {
		updateFormData(data)
		goNext()
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto mb-5 space-y-10 md:max-w-2/3"
			>
				<div className="space-y-2">
					<TypographyH2>Address Information</TypographyH2>
					<TypographyMuted>
						{isIndividual
							? 'Where is the property manager located?'
							: "Where is the company's headquarters?"}
					</TypographyMuted>
				</div>

				<FieldGroup>
					<FormField
						name="address"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Street Address</FormLabel>
								<FormControl>
									<Input placeholder="21st Neon Street" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-2 gap-3">
						<FormField
							name="city"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>City</FormLabel>
									<FormControl>
										<Input placeholder="Accra" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="region"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Region</FormLabel>
									<FormControl>
										<Input placeholder="Greater Accra" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						name="country"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Country</FormLabel>
								<FormControl>
									<Input placeholder="Ghana" {...field} />
								</FormControl>
								<FormMessage />
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
