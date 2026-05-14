import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, HelpCircle, Mail, Phone } from 'lucide-react'
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
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '~/components/ui/input-group'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

const ValidationSchema = z
	.object({
		type: z.enum(['INDIVIDUAL', 'COMPANY'], {
			error: 'Please select a type',
		}),
		contact_name: z.string().min(2, 'Please enter a valid name').optional(),
		contact_email: z.email('Please enter a valid email address'),
		contact_phone_number: z
			.string({ error: 'Contact phone number is required' })
			.min(5, 'Please enter a valid phone number'),
	})
	.superRefine((data, ctx) => {
		if (data.type === 'COMPANY') {
			if (!data.contact_name) {
				ctx.addIssue({
					code: 'custom',
					message: 'Please enter a valid name',
					path: ['contact_name'],
				})
			}
		}
	})

type FormSchema = z.infer<typeof ValidationSchema>

export function Step3() {
	const {
		goBack,
		formData,
		onSubmit: submit,
		updateFormData,
		isSubmitting,
	} = useNewPMContext()
	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			type: formData.type,
			contact_name: formData.contact_name,
		},
	})

	const { watch, control, handleSubmit } = rhfMethods

	const isIndividual = watch('type') === 'INDIVIDUAL'

	const onSubmit = (data: FormSchema) => {
		submit({
			...formData,
			...data,
			contact_name: isIndividual ? formData.name : data.contact_name,
		})
		updateFormData(data)
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto mb-5 space-y-10 md:max-w-2/3"
			>
				<div className="space-y-2">
					<TypographyH2>Contact Details</TypographyH2>
					<TypographyMuted>
						{isIndividual
							? 'Enter the contact details for this property manager.'
							: "Enter the company's primary contact person."}
					</TypographyMuted>
				</div>

				<FieldGroup>
					{isIndividual ? null : (
						<FormField
							name="contact_name"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Contact Person</FormLabel>
									<FormControl>
										<Input
											placeholder="Full name of contact person"
											type="text"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					<FormField
						name="contact_email"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<InputGroup>
										<InputGroupInput
											type="email"
											{...field}
											placeholder="m@example.com"
										/>
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
													<p>
														Used to send notifications to the property manager
													</p>
												</TooltipContent>
											</Tooltip>
										</InputGroupAddon>
									</InputGroup>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						name="contact_phone_number"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Phone Number</FormLabel>
								<FormControl>
									<InputGroup>
										<InputGroupInput
											{...field}
											type="tel"
											placeholder="+233 20 000 0000"
										/>
										<InputGroupAddon>
											<Phone />
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
													<p>
														Used to send notifications to the property manager
													</p>
												</TooltipContent>
											</Tooltip>
										</InputGroupAddon>
									</InputGroup>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</FieldGroup>

				<div className="mt-10 flex items-center justify-end gap-x-5">
					<Button onClick={goBack} type="button" size="sm" variant="ghost">
						<ArrowLeft />
						Go Back
					</Button>
					<Button
						size="lg"
						disabled={isSubmitting}
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						{isSubmitting ? <Spinner /> : null}
						Create Property Manager
					</Button>
				</div>
			</form>
		</Form>
	)
}
