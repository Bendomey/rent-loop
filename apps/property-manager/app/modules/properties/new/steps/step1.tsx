import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { PropertyTagInput } from '~/components/property-tag'
import { Button } from '~/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

interface Props {
	onGoBack?: () => void
	onGoNext?: () => void
}

export function Step1({ onGoBack, onGoNext }: Props) {
	const [tags, setTags] = useState<string[]>([])
	return (
		<main className="mx-auto mb-5 space-y-10 md:max-w-2/3">
			<div className="space-y-2">
				<TypographyH2 className="">Basic Information</TypographyH2>
				<TypographyMuted className=""></TypographyMuted>
			</div>

			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="name">Name</FieldLabel>
					<Input
						id="name"
						type="text"
						placeholder="Enter property name"
						required
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="description">Property Details</FieldLabel>
					<Textarea
						id="description"
						placeholder="Briefly describe your property (e.g., size, features, or highlights)"
					/>
				</Field>

				<PropertyTagInput value={tags} onChange={setTags} />
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
