import { createContext, useContext, useState } from 'react'
import type { BulkOnboardLeaseEntryInput } from '~/api/leases'

export interface DraftLeaseEntry {
	id: string // local uuid for table keying — use crypto.randomUUID()
	unit_id: string
	unit_name: string
	tenant_name: string // derived: first_name + ' ' + last_name
	rent_fee: number
	rent_fee_currency: string
	lease_agreement_document_url: string
	formData: Partial<BulkOnboardLeaseEntryInput>
	isComplete: boolean
	missingFields: string[]
}

interface BulkOnboardContextType {
	entries: DraftLeaseEntry[]
	editingEntryId: string | null // null = table view; set to entry.id = edit mode; 'new' = new entry wizard
	isSubmitting: boolean
	addOrUpdateEntry: (entry: DraftLeaseEntry) => void
	removeEntry: (id: string) => void
	startEdit: (id: string | null) => void
	setIsSubmitting: (v: boolean) => void
}

const BulkOnboardContext = createContext<BulkOnboardContextType | undefined>(
	undefined,
)

export function BulkOnboardProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [entries, setEntries] = useState<DraftLeaseEntry[]>([])
	const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const addOrUpdateEntry = (entry: DraftLeaseEntry) => {
		setEntries((prev) => {
			const existing = prev.findIndex((e) => e.id === entry.id)
			if (existing >= 0) {
				const next = [...prev]
				next[existing] = entry
				return next
			}
			return [...prev, entry]
		})
	}

	const removeEntry = (id: string) => {
		setEntries((prev) => prev.filter((e) => e.id !== id))
	}

	const startEdit = (id: string | null) => setEditingEntryId(id)

	return (
		<BulkOnboardContext.Provider
			value={{
				entries,
				editingEntryId,
				isSubmitting,
				addOrUpdateEntry,
				removeEntry,
				startEdit,
				setIsSubmitting,
			}}
		>
			{children}
		</BulkOnboardContext.Provider>
	)
}

export function useBulkOnboard() {
	const ctx = useContext(BulkOnboardContext)
	if (!ctx)
		throw new Error('useBulkOnboard must be used within BulkOnboardProvider')
	return ctx
}

export function isDraftComplete(
	entry: Partial<BulkOnboardLeaseEntryInput> & {
		lease_agreement_document_url?: string
	},
): {
	isComplete: boolean
	missingFields: string[]
} {
	const required: Array<keyof BulkOnboardLeaseEntryInput> = [
		'unit_id',
		'first_name',
		'last_name',
		'phone',
		'gender',
		'date_of_birth',
		'nationality',
		'marital_status',
		'current_address',
		'id_type',
		'id_number',
		'emergency_contact_name',
		'emergency_contact_phone',
		'relationship_to_emergency_contact',
		'rent_fee',
		'rent_fee_currency',
		'move_in_date',
		'stay_duration_frequency',
		'stay_duration',
		'rent_payment_status',
		'security_deposit_fee',
		'security_deposit_fee_currency',
		'lease_agreement_document_url',
	]
	const missingFields = required.filter((k) => !entry[k] && entry[k] !== 0)
	if (entry.rent_payment_status === 'PARTIAL') {
		if (!entry.periods_paid) missingFields.push('periods_paid')
		if (!entry.billing_cycle_start_date)
			missingFields.push('billing_cycle_start_date')
	}
	return { isComplete: missingFields.length === 0, missingFields }
}
