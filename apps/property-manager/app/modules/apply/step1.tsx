import { ArrowLeft } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

interface Props {
	onGoBack?: () => void
	onGoNext?: () => void
}

export function Step1({ onGoBack, onGoNext }: Props) {
	return (
		<main className="mx-auto mb-5 space-y-10 md:max-w-2/3">
			<div className="space-y-2">
				<TypographyH2 className="">Basic Information</TypographyH2>
				<TypographyMuted className="">
					Personal details and application.
				</TypographyMuted>
			</div>

			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="name">Name</FieldLabel>
					<Input id="name" type="text" placeholder="Enter your name" required />
				</Field>
				<Field>
					<FieldLabel htmlFor="dob">Date Of Birth</FieldLabel>
					<Input
						id="dob"
						type="date"
						placeholder="Enter your date of birth"
						required
					/>
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
							required
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="id_expiry">ID Expiry</FieldLabel>
						<Input
							id="id_expiry"
							type="date"
							placeholder="Enter your ID expiry date"
							required
						/>
					</Field>
				</FieldGroup>
				{/* <Field>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="about">About</FieldLabel>
                            <Textarea
                                id="about"
                                placeholder="About the company..."
                                rows={4}
                            />
                            <FieldDescription>
                                Any details your want to share about the company?
                            </FieldDescription>
                        </Field>
                    </FieldGroup>
                </Field> */}
			</FieldGroup>

			<div className="mt-10 flex items-center justify-end space-x-5">
				<Button onClick={onGoBack} size="sm" variant="ghost">
					<ArrowLeft />
					Go Back
				</Button>
				<Button
					onClick={onGoNext}
					size="lg"
					variant="default"
					className="bg-rose-600 hover:bg-rose-700"
				>
					Next
				</Button>
			</div>
		</main>
	)
}
