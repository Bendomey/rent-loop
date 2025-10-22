import { Separator } from '@radix-ui/react-separator'
import { ArrowLeft, Search } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '~/components/ui/input-group'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

interface Props {
	onGoBack?: () => void
	onGoNext?: () => void
}

export function Step2({ onGoBack, onGoNext }: Props) {
	return (
		<main className="mx-auto mb-5 space-y-10 md:max-w-2/3">
			<div className="space-y-2">
				<TypographyH2 className="">Address Information</TypographyH2>
				<TypographyMuted className="">
					Where are you located?
				</TypographyMuted>
			</div>

			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="name">Address</FieldLabel>
					<InputGroup>
						<InputGroupInput placeholder="Search address..." />
						<InputGroupAddon>
							<Search />
							<Separator
								orientation="vertical"
								className="data-[orientation=vertical]:h-4"
							/>
						</InputGroupAddon>
					</InputGroup>
				</Field>

				<Field>
										<FieldLabel htmlFor="gps_address">GPS Address</FieldLabel>
										<Input
											id="gps_address"
											type="text"
											placeholder="Enter your GPS address (e.g., GM-123-4567)"
											required
										/>
									</Field>
				
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
