import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useBulkOnboard } from '../context'
import { UnitSelect } from '~/components/SingleSelect/unit-select'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { safeString } from '~/lib/strings'
import { useProperty } from '~/providers/property-provider'

const Schema = z.object({
	unit_id: z.string({ error: 'Please select a unit' }).min(1),
	unit_name: z.string(),
})

type FormValues = z.infer<typeof Schema>

interface Step1Props {
	initialValues?: Partial<FormValues>
	onNext: (values: FormValues & { unit: PropertyUnit | null }) => void
	onCancel: () => void
}

export function WizardStep1({ initialValues, onNext, onCancel }: Step1Props) {
	const { clientUserProperty } = useProperty()
	const { entries, editingEntryId } = useBulkOnboard()
	const propertyId = safeString(clientUserProperty?.property_id)

	// Exclude units already used in the current batch (except the one being edited)
	const excludedUnitIds = entries
		.filter((e) => e.id !== editingEntryId)
		.map((e) => e.unit_id)

	const [selectedUnit, setSelectedUnit] = useState<PropertyUnit | null>(null)

	const { setValue, watch, formState, handleSubmit, setError } =
		useForm<FormValues>({
			resolver: zodResolver(Schema),
			defaultValues: initialValues ?? {},
		})

	const onSubmit = (data: FormValues) => {
		if (excludedUnitIds.includes(data.unit_id)) {
			setError('unit_id', {
				message: 'This unit is already added to the batch.',
			})
			return
		}
		onNext({ ...data, unit: selectedUnit })
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="mx-auto mb-10 space-y-8 md:max-w-2xl"
		>
			<div className="mt-10 space-y-2 border-b pb-6">
				<TypographyH2 className="text-2xl font-bold">Select Unit</TypographyH2>
				<TypographyMuted>
					Choose which unit this tenant is occupying.
				</TypographyMuted>
			</div>

			<div className="space-y-4 rounded-lg border bg-slate-50 p-6 dark:bg-slate-900">
				<Label className="text-base font-semibold">Unit</Label>
				<UnitSelect
					label=""
					property_id={propertyId}
					value={watch('unit_id')}
					onChange={({ id, name, unit }) => {
						setValue('unit_id', id, { shouldDirty: true, shouldValidate: true })
						setValue('unit_name', name)
						setSelectedUnit(unit)
					}}
				/>
				{formState.errors?.unit_id ? (
					<TypographySmall className="text-destructive">
						{formState.errors.unit_id.message}
					</TypographySmall>
				) : null}
			</div>

			<div className="flex items-center justify-between border-t pt-6">
				<Button type="button" variant="outline" onClick={onCancel}>
					Back to Overview
				</Button>
				<Button
					type="submit"
					disabled={!watch('unit_id')}
					className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
				>
					Next <ArrowRight className="ml-2 h-4 w-4" />
				</Button>
			</div>
		</form>
	)
}
