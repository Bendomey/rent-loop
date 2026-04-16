import { useState } from 'react'
import { isDraftComplete, useBulkOnboard } from '../context'
import type { DraftLeaseEntry } from '../context'
import { WizardStep1 } from './step1'
import { WizardStep2 } from './step2'
import type { Step2Values } from './step2'
import { WizardStep3 } from './step3'
import type { Step3Values } from './step3'
import { WizardStep4 } from './step4'
import type { BulkOnboardLeaseEntryInput } from '~/api/leases'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis } from '~/lib/format-amount'

const TOTAL_STEPS = 4

function paymentFreqToDurationFreq(
	freq: PropertyUnit['payment_frequency'],
): Step3Values['stay_duration_frequency'] {
	return freq === 'DAILY' ? 'DAYS' : 'MONTHS'
}

interface UnitDefaults {
	rent_fee: number
	rent_fee_currency: string
	payment_frequency: PropertyUnit['payment_frequency']
	stay_duration_frequency: Step3Values['stay_duration_frequency']
}

interface WizardData {
	unit_id: string
	unit_name: string
	unitDefaults?: UnitDefaults
	step2: Partial<Step2Values>
	step3: Partial<Step3Values>
	lease_agreement_document_url: string
}

interface BulkOnboardWizardProps {
	editingEntry?: DraftLeaseEntry
}

export function BulkOnboardWizard({ editingEntry }: BulkOnboardWizardProps) {
	const { addOrUpdateEntry, startEdit } = useBulkOnboard()
	const [step, setStep] = useState(1)
	const [data, setData] = useState<Partial<WizardData>>(() => {
		if (!editingEntry) return {}
		const fd = editingEntry.formData
		return {
			unit_id: editingEntry.unit_id,
			unit_name: editingEntry.unit_name,
			// Explicitly split formData into per-step shapes so each step's defaultValues
			// date-coercion guards fire correctly (ISO strings → Date objects).
			step2: {
				first_name: fd.first_name,
				other_names: fd.other_names,
				last_name: fd.last_name,
				email: fd.email,
				phone: fd.phone,
				gender: fd.gender as Step2Values['gender'],
				date_of_birth: fd.date_of_birth
					? new Date(fd.date_of_birth)
					: undefined,
				nationality: fd.nationality,
				marital_status: fd.marital_status as Step2Values['marital_status'],
				current_address: fd.current_address,
				id_type: fd.id_type as Step2Values['id_type'],
				id_number: fd.id_number,
				emergency_contact_name: fd.emergency_contact_name,
				emergency_contact_phone: fd.emergency_contact_phone,
				relationship_to_emergency_contact: fd.relationship_to_emergency_contact,
				occupation: fd.occupation,
				employer: fd.employer,
			} as Partial<Step2Values>,
			step3: {
				rent_fee: fd.rent_fee,
				rent_fee_currency: fd.rent_fee_currency,
				payment_frequency:
					fd.payment_frequency as Step3Values['payment_frequency'],
				move_in_date: fd.move_in_date ? new Date(fd.move_in_date) : undefined,
				stay_duration: fd.stay_duration,
				stay_duration_frequency:
					fd.stay_duration_frequency as Step3Values['stay_duration_frequency'],
				rent_payment_status:
					(fd.rent_payment_status as Step3Values['rent_payment_status']) ??
					'NONE',
				periods_paid: fd.periods_paid,
				billing_cycle_start_date: fd.billing_cycle_start_date
					? new Date(fd.billing_cycle_start_date)
					: undefined,
				security_deposit_fee: fd.security_deposit_fee,
				security_deposit_fee_currency: fd.security_deposit_fee_currency,
			} as Partial<Step3Values>,
			lease_agreement_document_url: editingEntry.lease_agreement_document_url,
		}
	})

	const progressPct = (step / TOTAL_STEPS) * 100

	const handleSave = (leaseUrl: string) => {
		// By step 4, steps 2 and 3 have been validated and submitted — cast is safe.
		const s2 = data.step2 as Step2Values
		const s3 = data.step3 as Step3Values
		const formData: BulkOnboardLeaseEntryInput = {
			unit_id: data.unit_id!,
			first_name: s2.first_name,
			other_names: s2.other_names,
			last_name: s2.last_name,
			email: s2.email || undefined,
			phone: s2.phone,
			gender: s2.gender,
			date_of_birth: localizedDayjs(s2.date_of_birth).toISOString(),
			nationality: s2.nationality,
			marital_status: s2.marital_status,
			current_address: s2.current_address,
			id_type: s2.id_type,
			id_number: s2.id_number,
			emergency_contact_name: s2.emergency_contact_name,
			emergency_contact_phone: s2.emergency_contact_phone,
			relationship_to_emergency_contact: s2.relationship_to_emergency_contact,
			occupation: s2.occupation,
			employer: s2.employer,
			rent_fee: s3.rent_fee,
			rent_fee_currency: s3.rent_fee_currency,
			payment_frequency: s3.payment_frequency,
			move_in_date: localizedDayjs(s3.move_in_date).toISOString(),
			stay_duration_frequency: s3.stay_duration_frequency,
			stay_duration: s3.stay_duration,
			rent_payment_status: s3.rent_payment_status,
			periods_paid: s3.periods_paid,
			billing_cycle_start_date: s3.billing_cycle_start_date
				? localizedDayjs(s3.billing_cycle_start_date).toISOString()
				: undefined,
			security_deposit_fee: s3.security_deposit_fee,
			security_deposit_fee_currency: s3.security_deposit_fee_currency,
			lease_agreement_document_url: leaseUrl,
		}

		const { isComplete, missingFields } = isDraftComplete(formData)

		const entry: DraftLeaseEntry = {
			id: editingEntry?.id ?? crypto.randomUUID(),
			unit_id: data.unit_id!,
			unit_name: data.unit_name!,
			tenant_name: `${formData.first_name} ${formData.last_name}`,
			rent_fee: formData.rent_fee,
			rent_fee_currency: formData.rent_fee_currency,
			lease_agreement_document_url: leaseUrl,
			formData,
			isComplete,
			missingFields,
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
									data.unit_id
										? { unit_id: data.unit_id, unit_name: data.unit_name }
										: undefined
								}
								onNext={(v) => {
									setData((d) => ({
										...d,
										unit_id: v.unit_id,
										unit_name: v.unit_name,
										// Only update unitDefaults when a unit was actually (re-)selected;
										// v.unit is null if the user proceeded without changing the unit
										// during an edit, in which case we keep the existing defaults.
										...(v.unit
											? {
													unitDefaults: {
														rent_fee: convertPesewasToCedis(v.unit.rent_fee),
														rent_fee_currency: v.unit.rent_fee_currency,
														payment_frequency: v.unit.payment_frequency,
														stay_duration_frequency: paymentFreqToDurationFreq(
															v.unit.payment_frequency,
														),
													},
												}
											: {}),
									}))
									setStep(2)
								}}
								onCancel={() => startEdit(null)}
							/>
						)}
						{step === 2 && (
							<WizardStep2
								initialValues={data.step2}
								onNext={(v) => {
									setData((d) => ({ ...d, step2: v }))
									setStep(3)
								}}
								onBack={() => setStep(1)}
								onCancel={() => startEdit(null)}
							/>
						)}
						{step === 3 && (
							<WizardStep3
								initialValues={data.step3}
								unitDefaults={data.unitDefaults}
								onNext={(v) => {
									setData((d) => ({ ...d, step3: v }))
									setStep(4)
								}}
								onBack={() => setStep(2)}
								onCancel={() => startEdit(null)}
							/>
						)}
						{step === 4 && (
							<WizardStep4
								initialUrl={data.lease_agreement_document_url}
								onSave={handleSave}
								onBack={() => setStep(3)}
								onCancel={() => startEdit(null)}
							/>
						)}
					</div>
				</div>
			</div>
		</main>
	)
}
