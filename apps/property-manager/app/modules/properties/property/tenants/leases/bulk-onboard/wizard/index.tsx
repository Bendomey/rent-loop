import { useState } from 'react'
import type { DraftApplicationEntry } from '../context'
import { useBulkOnboard } from '../context'
import { WizardStep1 } from './step1'
import { WizardStep2New } from './step2-new'
import type { Step2NewValues } from './step2-new'

const TOTAL_STEPS = 2

interface WizardData {
	desired_unit_id?: string
	unit_name?: string
	step2: Partial<Step2NewValues>
}

interface BulkOnboardWizardProps {
	editingEntry?: DraftApplicationEntry
}

export function BulkOnboardWizard({ editingEntry }: BulkOnboardWizardProps) {
	const { addOrUpdateEntry, startEdit } = useBulkOnboard()
	const [step, setStep] = useState(1)
	const [data, setData] = useState<Partial<WizardData>>(() => {
		if (!editingEntry) return {}
		return {
			desired_unit_id: editingEntry.desired_unit_id,
			unit_name: editingEntry.unit_name,
			step2: {
				phone: editingEntry.phone,
				first_name: editingEntry.first_name,
				last_name: editingEntry.last_name,
				email: editingEntry.email,
				gender: editingEntry.gender as Step2NewValues['gender'],
				date_of_birth: editingEntry.date_of_birth
					? new Date(editingEntry.date_of_birth)
					: undefined,
				nationality: editingEntry.nationality,
				marital_status:
					editingEntry.marital_status as Step2NewValues['marital_status'],
				id_type: editingEntry.id_type as Step2NewValues['id_type'],
				id_number: editingEntry.id_number,
				current_address: editingEntry.current_address,
				occupation: editingEntry.occupation,
				employer: editingEntry.employer,
			},
		}
	})

	const progressPct = (step / TOTAL_STEPS) * 100

	const handleSave = (values: Step2NewValues) => {
		const entry: DraftApplicationEntry = {
			id: editingEntry?.id ?? crypto.randomUUID(),
			phone: values.phone,
			first_name: values.first_name || undefined,
			last_name: values.last_name || undefined,
			email: values.email || undefined,
			gender: values.gender || undefined,
			date_of_birth: values.date_of_birth
				? values.date_of_birth.toISOString()
				: undefined,
			nationality: values.nationality || undefined,
			marital_status: values.marital_status || undefined,
			id_type: values.id_type || undefined,
			id_number: values.id_number || undefined,
			current_address: values.current_address || undefined,
			desired_unit_id: data.desired_unit_id || undefined,
			unit_name: data.unit_name || undefined,
			occupation: values.occupation || undefined,
			employer: values.employer || undefined,
		}

		addOrUpdateEntry(entry)
		startEdit(null)
	}

	return (
		<main className="w-full">
			<div className="-mx-2 w-full md:-mx-7">
				<div
					className="bg-rose-600 transition-all duration-300"
					style={{ height: '3px', width: `${progressPct}%` }}
				/>
				<div className="flex min-h-[88vh] items-center justify-center">
					<div className="w-full max-w-4xl px-4 md:px-0">
						{step === 1 && (
							<WizardStep1
								initialValues={
									data.desired_unit_id
										? {
												unit_id: data.desired_unit_id,
												unit_name: data.unit_name,
											}
										: undefined
								}
								onNext={(v) => {
									setData((d) => ({
										...d,
										desired_unit_id: v.unit_id,
										unit_name: v.unit_name,
									}))
									setStep(2)
								}}
								onSkip={() => {
									setData((d) => ({
										...d,
										desired_unit_id: undefined,
										unit_name: undefined,
									}))
									setStep(2)
								}}
								onCancel={() => startEdit(null)}
							/>
						)}
						{step === 2 && (
							<WizardStep2New
								initialValues={data.step2}
								onSave={(v) => {
									setData((d) => ({ ...d, step2: v }))
									handleSave(v)
								}}
								onBack={() => setStep(1)}
								onCancel={() => startEdit(null)}
							/>
						)}
					</div>
				</div>
			</div>
		</main>
	)
}
