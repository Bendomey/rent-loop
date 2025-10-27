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
	const { watch, handleSubmit, trigger, control, setValue, formState } =
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
			onSubmit={handleSubmit(onSubmit)}
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
						<Field>
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

						<Field>
							<FieldLabel htmlFor="role">ID Type</FieldLabel>
							<Select>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Select a type" />
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
						</Field>

						<FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="id_number">ID Number</FieldLabel>
								<Input
									id="id_number"
									type="text"
									placeholder="Enter your ID number"
								/>
							</Field>
							<Field>
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
						<Field>
							<FieldLabel htmlFor="about">About</FieldLabel>
							<Textarea
								id="about"
								placeholder="About the company..."
								rows={5}
							/>
							<FieldDescription>
								Any details you want to share about the company?
							</FieldDescription>
						</Field>

						<Field>
							<FieldLabel htmlFor="registration_number">
								Registration Number
							</FieldLabel>
							<Input id="registration_number" type="text" />
							<FieldDescription>Optional</FieldDescription>
						</Field>

						<FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="support_email">Support Email</FieldLabel>
								<Input
									id="support_email"
									type="email"
									placeholder="Enter your support email"
								/>
								<FieldDescription>Optional</FieldDescription>
							</Field>
							<Field>
								<FieldLabel htmlFor="support_phone">
									Support Phone Number
								</FieldLabel>
								<Input
									id="support_phone"
									type="tel"
									placeholder="Enter your support phone number"
								/>
								<FieldDescription>Optional</FieldDescription>
							</Field>
						</FieldGroup>
					</>
				)}
			</FieldGroup>

			<div className="mt-10 flex items-center justify-end space-x-5">
				<Button onClick={goBack} size="sm" variant="ghost">
					<ArrowLeft />
					Go Back
				</Button>
				<Button
					onClick={goNext}
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
