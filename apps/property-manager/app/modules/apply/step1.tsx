import { ArrowLeft } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'
import { useApplyContext, type FormSchema } from './context'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

export function Step1() {
	const { goBack, goNext } = useApplyContext()
	const { watch, trigger, control, setValue, formState } =
		useFormContext<FormSchema>()

	const isIndividual = watch('type') === 'INDIVIDUAL'

	const onSubmit = async () => {
		const individualFields: Array<keyof FormSchema> = [
			'name',
			'date_of_birth',
			'id_type',
			'id_number',
			'id_expiry',
		]
		const companyFields: Array<keyof FormSchema> = [
			'name',
			'registration_number',
			'description',
			'support_email',
			'support_phone',
			'website_url',
		]

		const isValid = await trigger(
			isIndividual ? individualFields : companyFields,
		)
		if (isValid) {
			goNext()
		}
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				void onSubmit()
			}}
			className="mx-auto mb-5 space-y-5 md:max-w-2/3"
		>
			<div className="space-y-2">
				<TypographyH2 className="">
					{isIndividual ? 'Basic' : 'Company'} Information
				</TypographyH2>
				<TypographyMuted className="">
					{isIndividual
						? 'Please provide your personal information as an individual property owner.'
						: "Please provide your company's information to proceed with the application."}
				</TypographyMuted>
			</div>

			<FieldGroup>
				<Controller
					name="name"
					control={control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="name">Name</FieldLabel>
							<Input
								id="name"
								aria-invalid={fieldState.invalid}
								type="text"
								{...field}
								placeholder=""
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>

				{isIndividual ? (
					<>
						<Field data-invalid={!!formState.errors.date_of_birth}>
							<Label htmlFor="dob" className="px-1">
								Date of birth
							</Label>
							<DatePickerInput
								value={watch('date_of_birth')}
								onChange={(newDate) =>
									setValue('date_of_birth', newDate, { shouldDirty: true })
								}
							/>
							{formState.errors.date_of_birth ? (
								<FieldError errors={[formState.errors.date_of_birth]} />
							) : null}
						</Field>
						<Controller
							name="id_type"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="id_type">ID Type</FieldLabel>
									<Select aria-invalid={fieldState.invalid} {...field}>
										<SelectTrigger className="w-[180px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>All Types</SelectLabel>
												<SelectItem value="NATIONAL_ID">National ID</SelectItem>
												<SelectItem value="PASSPORT">Passport</SelectItem>
												<SelectItem value="DRIVERS_LICENSE">
													Driver's License
												</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
									{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
								</Field>
							)}
						/>


						<FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<Controller
								name="id_number"
								control={control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="id_number">ID Number</FieldLabel>
										<Input
											id="id_number"
											aria-invalid={fieldState.invalid}
											type="text"
											{...field}
										/>
										{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
									</Field>
								)}
							/>
							<Field data-invalid={!!formState.errors.id_expiry}>
								<Label htmlFor="id_expiry" className="px-1">
									ID Expiry
								</Label>
								<DatePickerInput
									value={watch('id_expiry')}
									onChange={(newDate) =>
										setValue('id_expiry', newDate, { shouldDirty: true })
									}
								/>
								{formState.errors.id_expiry ? (
									<FieldError errors={[formState.errors.id_expiry]} />
								) : null}
							</Field>
						</FieldGroup>
					</>
				) : (
					<>
						<Controller
							name="description"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="description">About</FieldLabel>
									<Textarea
										aria-invalid={fieldState.invalid}
										id="description"
										placeholder="About the company..."
										rows={5}
										{...field}
									/>
									<FieldDescription>
										Any details you want to share about the company?
									</FieldDescription>
									{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
								</Field>
							)}
						/>

						<Controller
							name="registration_number"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="registration_number">
										Registration Number
									</FieldLabel>
									<Input aria-invalid={fieldState.invalid} id="registration_number" {...field} type="text" />
									<FieldDescription>Optional</FieldDescription>
									{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
								</Field>
							)}
						/>

						<FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<Controller
								name="support_email"
								control={control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="support_email">Support Email</FieldLabel>
										<Input aria-invalid={fieldState.invalid} id="support_email" {...field} type="text" />
										<FieldDescription>Optional</FieldDescription>
										{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
									</Field>
								)}
							/>
							<Controller
								name="support_phone"
								control={control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="support_phone">Support Phone</FieldLabel>
										<Input aria-invalid={fieldState.invalid} id="support_phone" {...field} type="text" />
										<FieldDescription>Optional</FieldDescription>
										{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
									</Field>
								)}
							/>
						</FieldGroup>
					</>
				)}
			</FieldGroup>

			<div className="mt-10 flex items-center justify-end space-x-5">
				<Button onClick={goBack} type='button' size="sm" variant="ghost">
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
	)
}
