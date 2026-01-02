import { ArrowLeft, Pencil } from 'lucide-react'
import { useCreatePropertyContext } from '../context'
import { Image } from '~/components/Image'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import {
	getPropertyStatusLabel,
	getPropertyTypeLabel,
} from '~/lib/properties.utils'

export function Step3() {
	const { goBack, goToPage, formData, onSubmit, isSubmitting } =
		useCreatePropertyContext()

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
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				await onSubmit(formData)
			}}
			className="mx-auto mt-10 mb-5 space-y-8 md:max-w-2/3"
		>
			<div className="space-y-2">
				<TypographyH2>Preview and Submit</TypographyH2>
				<TypographyMuted>
					Review all information below. Edit any step to make changes before
					submitting.
				</TypographyMuted>
			</div>

			<section className="grid gap-4">
				{formData.images && formData.images.length > 0 ? (
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-semibold">Image</h3>
							<div>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={() => goToPage(1)}
								>
									<Pencil className="mr-2" /> Edit
								</Button>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-2 md:grid-cols-3">
							{formData.images.map((imageUrl, index) => (
								<div key={index}>
									<Image
										src={imageUrl}
										alt={`Property image ${index + 1}`}
										className="h-full w-full rounded-md object-cover"
									/>
								</div>
							))}
						</div>
					</div>
				) : null}
				<div className="rounded-md border p-4">
					<div className="flex items-start justify-between">
						<div>
							<h3 className="text-sm font-semibold">Property type & Status</h3>
							<p className="mt-1 text-xs text-zinc-600">
								{formData.type ? getPropertyTypeLabel(formData.type) : '—'} ·{' '}
								{formData.status
									? getPropertyStatusLabel(formData.status)
									: '—'}
							</p>
						</div>
						<div>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={() => goToPage(0)}
							>
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
								{renderField('Name', formData.name)}
								{renderField('Tags', formData.tags)}
							</div>
							<div className="mt-2 grid gap-2 sm:grid-cols-1">
								{renderField('Description', formData.description ?? 'N/A')}
							</div>
						</div>
						<div>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={() => goToPage(1)}
							>
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
								{renderField('Selected address', formData.address)}
								{renderField('GPS Address', formData?.gps_address?.toString())}
							</div>
						</div>
						<div>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={() => goToPage(2)}
							>
								<Pencil className="mr-2" /> Edit
							</Button>
						</div>
					</div>
				</div>
			</section>

			<div className="mt-6 flex items-center justify-end space-x-4">
				<Button onClick={goBack} type="button" size="sm" variant="ghost">
					<ArrowLeft />
					Go Back
				</Button>
				<Button
					disabled={isSubmitting}
					size="lg"
					variant="default"
					className="bg-rose-600 hover:bg-rose-700"
				>
					{isSubmitting ? <Spinner /> : null}
					Submit
				</Button>
			</div>
		</form>
	)
}
