import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

const DUMMY_PREVIEWS: Property = {
	id: 'property-123',
	type: 'SINGLE',
	status: 'Property.Status.Active',
	name: 'Osu Studio Apartment',
	description:
		'Cozy self-contained studio near Oxford Street, ideal for single professionals. Includes kitchenette and private bathroom.',
	address: 'Osu, Oxford Street, Accra (5.5543, -0.1869)',
	gps_address: 'GH-123-4567',
	zip_code: 'GP-123-4567',
	city: 'Accra',
	state: 'Greater Accra',
	tags: ['studio', 'furnished', 'near-market'],
	created_at: new Date(),
	updated_at: new Date(),
}

interface Props {
	onGoBack?: () => void
	onSubmit?: () => void
	onEdit?: (stepIndex: number) => void
	formData?: Property
}

export function Step3({ onGoBack, onSubmit, onEdit, formData }: Props) {
	const data = formData ?? DUMMY_PREVIEWS

	const renderField = (label: string, value?: string | string[]) => (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<div className="text-sm text-zinc-700">
				{Array.isArray(value)
					? value.length
						? value.join(', ')
						: '—'
					: (value ?? '—')}
			</div>
		</Field>
	)

	return (
		<main className="mx-auto mb-5 space-y-8 md:max-w-2/3">
			<div className="space-y-2">
				<TypographyH2>Preview and Submit</TypographyH2>
				<TypographyMuted>
					Review all information below. Edit any step to make changes before
					submitting.
				</TypographyMuted>
			</div>

			<section className="grid gap-4">
				<div className="rounded-md border p-4">
					<div className="flex items-start justify-between">
						<div>
							<h3 className="text-sm font-semibold">Property type & status</h3>
							<p className="mt-1 text-xs text-zinc-600">
								{data.type ?? '—'} · {data.status ?? '—'}
							</p>
						</div>
						<div>
							<Button size="sm" variant="ghost" onClick={() => onEdit?.(0)}>
								<Pencil className="mr-2" /> Edit
							</Button>
						</div>
					</div>
				</div>

				<div className="rounded-md border p-4">
					<div className="flex items-start justify-between">
						<div className="w-full">
							<h3 className="text-sm font-semibold">Basic information</h3>
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								{renderField('Name', data.name)}
								{renderField('Tags', data.tags)}
							</div>
							<div className="mt-2 grid gap-2 sm:grid-cols-1">
								{renderField('Description', data.description)}
							</div>
						</div>
						<div>
							<Button size="sm" variant="ghost" onClick={() => onEdit?.(1)}>
								<Pencil className="mr-2" /> Edit
							</Button>
						</div>
					</div>
				</div>

				<div className="rounded-md border p-4">
					<div className="flex items-start justify-between">
						<div className="w-full">
							<h3 className="text-sm font-semibold">Address</h3>
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								{renderField('Selected address', data.address)}
								{renderField('GPS Address', data.gps_address)}
							</div>
						</div>
						<div>
							<Button size="sm" variant="ghost" onClick={() => onEdit?.(2)}>
								<Pencil className="mr-2" /> Edit
							</Button>
						</div>
					</div>
				</div>
			</section>

			<div className="mt-6 flex items-center justify-end space-x-4">
				<Button onClick={onGoBack} size="sm" variant="ghost">
					<ArrowLeft />
					Go Back
				</Button>
				<Button
					onClick={onSubmit}
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
