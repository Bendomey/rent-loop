import { ArrowLeft, HelpCircle, Mail, Phone } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '~/components/ui/field'
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

interface Props {
	onGoBack?: () => void
}

export function Step3({ onGoBack }: Props) {
	return (
		<main className="mx-auto mb-5 space-y-10 md:max-w-2/3">
			<div className="space-y-2">
				<TypographyH2 className="">Complete your Application</TypographyH2>
				<TypographyMuted className="">
					Kindly enter your account details to complete the application.
					{/* Kindly enter company's contact person */}
				</TypographyMuted>
			</div>

			<FieldGroup>
				{/* <Field>
                    <FieldLabel htmlFor="name">Full Name</FieldLabel>
                    <Input id="name" type="text" placeholder="Enter your full name" required />
                </Field> */}
				<Field>
					<FieldLabel htmlFor="email">
						Email <span className="text-red-600">*</span>
					</FieldLabel>
					<InputGroup>
						<InputGroupInput placeholder="m@example.com" />
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
					<FieldDescription>
						We'll send you an account activation link
					</FieldDescription>
				</Field>
				<Field>
					<FieldLabel htmlFor="phone">Phone Number</FieldLabel>
					<InputGroup>
						<InputGroupInput id="phone" type="tel" placeholder="201234567" />
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
				</Field>
			</FieldGroup>

			<div className="mt-10 flex items-center justify-end space-x-5">
				<Button onClick={onGoBack} size="sm" variant="ghost">
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
		</main>
	)
}
