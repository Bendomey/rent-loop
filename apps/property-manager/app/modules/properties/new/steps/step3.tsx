import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreatePropertyContext } from '../context'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Form } from '~/components/ui/form'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import {
	getPropertyStatusLabel,
	getPropertyTypeLabel,
} from '~/lib/properties.utils'

const ValidationSchema = z.object({})

type FormSchema = z.infer<typeof ValidationSchema>

export function Step3() {
	const {
		goBack,
		goToPage,
		formData,
		onSubmit: submit,
		updateFormData,
		isSubmitting,
	} = useCreatePropertyContext()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit } = rhfMethods

	const onSubmit = async (data: FormSchema) => {
		await submit({
			...formData,
			...data,
		})
		updateFormData(data)
	}

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
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
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
					<div className="rounded-md border p-4">
						<div className="flex items-start justify-between">
							<div>
								<h3 className="text-sm font-semibold">
									Property type & Status
								</h3>
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
									{renderField(
										'GPS Address',
										formData?.gps_address?.toString(),
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
		</Form>
	)
}
