import { ArrowLeft, HelpCircle, Mail, Phone } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'
import { useApplyContext, type FormSchema } from './context'
import { Button } from '~/components/ui/button'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '~/components/ui/input-group'
import { Separator } from '~/components/ui/separator'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

export function Step3() {
	const { goBack } = useApplyContext()
	const { watch, control, handleSubmit } = useFormContext<FormSchema>()

	const isIndividual = watch('type') === 'INDIVIDUAL'

	const onSubmit = (data: FormSchema) => {
		console.log('Final Submission Data:', data)
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="mx-auto mb-5 space-y-10 md:max-w-2/3">
			<div className="space-y-2">
				<TypographyH2 className="">Complete your Application</TypographyH2>
				<TypographyMuted className="">
					Almost done!{' '}
					{isIndividual
						? 'Kindly enter your account details to complete the application.'
						: "Kindly enter your company's contact person"}
				</TypographyMuted>
			</div>

			<FieldGroup>
				{isIndividual ? null : (
					<Controller
						name="contact_name"
						control={control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor="contact_name">Full Name</FieldLabel>
								<Input
									id="contact_name"
									aria-invalid={fieldState.invalid}
									type="text"
									{...field}
									placeholder="Enter your full name"
								/>
								{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
							</Field>
						)}
					/>
				)}

				<Controller
					name="contact_email"
					control={control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="contact_email">Email</FieldLabel>
							<InputGroup>
								<InputGroupInput aria-invalid={fieldState.invalid} id='contact_email' {...field} placeholder="m@example.com" />
								<InputGroupAddon>
									<Mail />
									<Separator
										orientation="vertical"
										className="data-[orientation=vertical]:h-4"
									/>
								</InputGroupAddon>
								<InputGroupAddon align="inline-end">
									<Tooltip>
										<TooltipTrigger asChild>
											<InputGroupButton
												variant="ghost"
												aria-label="Help"
												size="icon-xs"
											>
												<HelpCircle />
											</InputGroupButton>
										</TooltipTrigger>
										<TooltipContent>
											<p>We&apos;ll use this to send you notifications</p>
										</TooltipContent>
									</Tooltip>
								</InputGroupAddon>
							</InputGroup>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>


				<Controller
					name="contact_phone_number"
					control={control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="contact_phone_number">Phone Number</FieldLabel>
							<InputGroup>
								<InputGroupInput aria-invalid={fieldState.invalid} {...field} id="contact_phone_number" type="tel" placeholder="201234567" />
								<InputGroupAddon>
									<Phone />
									+233
									<Separator
										orientation="vertical"
										className="data-[orientation=vertical]:h-4"
									/>
								</InputGroupAddon>
								<InputGroupAddon align="inline-end">
									<Tooltip>
										<TooltipTrigger asChild>
											<InputGroupButton
												variant="ghost"
												aria-label="Help"
												size="icon-xs"
											>
												<HelpCircle />
											</InputGroupButton>
										</TooltipTrigger>
										<TooltipContent>
											<p>We&apos;ll use this to send you notifications</p>
										</TooltipContent>
									</Tooltip>
								</InputGroupAddon>
							</InputGroup>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
							<FieldDescription>
								By clicking submit, you agree to our{' '}
								<a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
							</FieldDescription>
						</Field>
					)}
				/>

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
					Submit
				</Button>
			</div>
		</form>
	)
}
