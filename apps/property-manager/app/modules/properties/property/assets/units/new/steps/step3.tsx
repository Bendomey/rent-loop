import { ArrowLeft, Pencil } from 'lucide-react'
import { useCreatePropertyUnitContext } from '../context'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { getPropertyUnitStatusLabel } from '~/lib/properties.utils'
import { toFirstUpperCase } from '~/lib/strings'

export function Step3() {
	const { goBack, goToPage, formData, onSubmit, isSubmitting } =
		useCreatePropertyUnitContext()

	const renderField = (
		label: string,
		value?: string | string[] | Record<string, string>,
	) => (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<div className="flex flex-wrap gap-2 text-sm text-zinc-700">
				{value == null
					? '—'
					: Array.isArray(value)
						? value.length
							? value.join(', ')
							: '—'
						: typeof value === 'object'
							? Object.entries(value).map(([key, val]) => (
									<span
										key={key}
										className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800"
									>
										{key}: {val}
									</span>
								))
							: value}
			</div>
		</Field>
	)

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				await onSubmit(formData)
			}}
			className="mx-auto mb-5 space-y-8 md:max-w-2/3"
		>
			<div className="space-y-2">
				<TypographyH2>Preview and Submit</TypographyH2>
				<TypographyMuted>
					Review all information below. Edit any step to make changes before
					submitting.
				</TypographyMuted>
			</div>

			<section className="grid gap-4">
				<div className="rounded-lg border bg-white p-5">
					<div className="flex items-start justify-between">
						<div>
							<h3 className="text-sm font-semibold">Unit Details</h3>
							<p className="mt-1 text-xs text-zinc-600">
								{formData.block ? toFirstUpperCase(formData.block) : '—'} ·{' '}
								{formData.type ? toFirstUpperCase(formData.type) : '—'} ·{' '}
								{formData.status
									? getPropertyUnitStatusLabel(formData.status)
									: '—'}
							</p>
						</div>

						<Button
							type="button"
							size="sm"
							variant="ghost"
							className="text-zinc-600 hover:text-zinc-900"
							onClick={() => goToPage(0)}
						>
							<Pencil className="mr-1 h-3 w-3" />
							Edit
						</Button>
					</div>
				</div>

				<div className="rounded-md border p-4">
					<div className="flex items-start justify-between">
						<div className="w-full">
							<h3 className="text-sm font-semibold">Basic information</h3>
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								{renderField('Name', formData.name)}
								{renderField('Tags', formData.tags)}
								{renderField('Features', formData.features)}
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
							<h3 className="text-sm font-semibold">Pricing & Area</h3>
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								{renderField('Area', formData.area?.toString())}
								{renderField(
									'Max Occupants Allowed',
									formData.max_occupants_allowed?.toString(),
								)}
								{renderField(
									'Rent Fee',
									formData?.rent_fee != null
										? `${formData.rent_fee_currency} ${formData.rent_fee}`
										: '—',
								)}
								{renderField(
									'Payment Frequency',
									formData?.payment_frequency
										? toFirstUpperCase(formData.payment_frequency)
										: 'N/A',
								)}
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
