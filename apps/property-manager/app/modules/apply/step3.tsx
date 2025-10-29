import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, HelpCircle, Mail, Phone } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useApplyContext } from './context'
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

const ValidationSchema = z
	.object({
		type: z.enum(['INDIVIDUAL', 'COMPANY'], {
			error: 'Please select a type',
		}),
		contact_name: z.string().min(2, 'Please enter a valid name').optional(),
		contact_email: z.email('Please enter a valid email address'),
		contact_phone_number: z
			.string({ error: 'Contact phone number is required' })
			.min(9, 'Please enter a valid phone number'),
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
	const { goBack, formData, updateFormData } = useApplyContext()
	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			type: formData.type,
		},
	})

	const { watch, control, handleSubmit } = rhfMethods

	const isIndividual = watch('type') === 'INDIVIDUAL'

	const onSubmit = (data: FormSchema) => {
		updateFormData(data)
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto mb-5 space-y-10 md:max-w-2/3"
			>
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
						<FormField
							name="contact_name"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Full Name</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter your full name"
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
										<InputGroupInput {...field} placeholder="m@example.com" />
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
											placeholder="201234567"
										/>
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
								</FormControl>
								<FormMessage />
								<FormDescription>
									By clicking submit, you agree to our{' '}
									<a href="#">Terms of Service</a> and{' '}
									<a href="#">Privacy Policy</a>.
								</FormDescription>
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
						Submit
					</Button>
				</div>
			</form>
		</Form>
	)
}
