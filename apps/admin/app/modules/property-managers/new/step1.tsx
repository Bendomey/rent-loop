import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useNewPMContext } from './context'
import { Button } from '~/components/ui/button'
import { FieldGroup } from '~/components/ui/field'
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
import { Textarea } from '~/components/ui/textarea'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

const ValidationSchema = z.object({
	type: z.enum(['INDIVIDUAL', 'COMPANY'], {
		error: 'Please select a type',
	}),
	name: z
		.string({ error: 'Name is required' })
		.min(2, 'Please enter a valid name'),
	description: z
		.string()
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	registration_number: z.string().optional(),
	support_email: z.string().optional(),
	support_phone: z.string().optional(),
	website_url: z.string().optional(),
	date_of_birth: z.string().optional(),
})

export type FormSchema = z.infer<typeof ValidationSchema>

export function Step1() {
	const { goBack, goNext, formData, updateFormData } = useNewPMContext()
	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			type: formData.type,
		},
	})

	const { watch, handleSubmit, control, setValue } = rhfMethods
	const isIndividual = watch('type') === 'INDIVIDUAL'

	useEffect(() => {
		if (formData.name) {
			setValue('name', formData.name, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.description) {
			setValue('description', formData.description, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.registration_number) {
			setValue('registration_number', formData.registration_number, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.support_email) {
			setValue('support_email', formData.support_email, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.support_phone) {
			setValue('support_phone', formData.support_phone, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.website_url) {
			setValue('website_url', formData.website_url, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.date_of_birth) {
			setValue('date_of_birth', formData.date_of_birth, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const onSubmit = (data: FormSchema) => {
		updateFormData({
			name: data.name,
			description: data.description,
			registration_number: data.registration_number,
			support_email: data.support_email,
			support_phone: data.support_phone,
			website_url: data.website_url,
			date_of_birth: data.date_of_birth,
		})
		goNext()
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto mb-5 space-y-5 md:max-w-2/3"
			>
				<div className="space-y-2">
					<TypographyH2>
						{isIndividual ? 'Basic' : 'Company'} Information
					</TypographyH2>
					<TypographyMuted>
						{isIndividual
							? "Provide the individual property manager's personal information."
							: "Provide the company's information to complete registration."}
					</TypographyMuted>
				</div>

				<FieldGroup>
					<FormField
						name="name"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{isIndividual ? 'Full Name' : 'Company Name'}
								</FormLabel>
								<FormControl>
									<Input type="text" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{isIndividual ? (
						<FormField
							name="date_of_birth"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Date of Birth</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					) : (
						<>
							<FormField
								name="description"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>About</FormLabel>
										<FormControl>
											<Textarea
												placeholder="About the company..."
												rows={4}
												{...field}
											/>
										</FormControl>
										<FormDescription>Optional</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								name="registration_number"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Registration Number</FormLabel>
										<FormControl>
											<Input type="text" {...field} />
										</FormControl>
										<FormDescription>Optional</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</>
					)}

					<FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
										<Input type="text" {...field} />
									</FormControl>
									<FormDescription>Optional</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</FieldGroup>

					<FormField
						name="website_url"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Website URL</FormLabel>
								<FormControl>
									<Input
										type="text"
										placeholder="https://company.com"
										{...field}
									/>
								</FormControl>
								<FormDescription>Optional</FormDescription>
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
