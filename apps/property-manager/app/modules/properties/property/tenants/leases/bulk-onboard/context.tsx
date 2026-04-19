import { createContext, useContext, useState } from 'react'
import type { BulkCreateTenantApplicationEntry } from '~/api/tenant-applications'

export interface DraftApplicationEntry {
	id: string // local uuid for table keying — use crypto.randomUUID()
	phone: string
	first_name?: string
	last_name?: string
	email?: string
	gender?: string
	date_of_birth?: string
	nationality?: string
	marital_status?: string
	id_type?: string
	id_number?: string
	current_address?: string
	desired_unit_id?: string
	unit_name?: string // display name, resolved from desired_unit_id
	occupation?: string
	employer?: string
}

interface BulkOnboardContextType {
	entries: DraftApplicationEntry[]
	editingEntryId: string | null // null = table view; set to entry.id = edit mode; 'new' = new entry wizard
	isSubmitting: boolean
	addOrUpdateEntry: (entry: DraftApplicationEntry) => void
	addManyEntries: (entries: DraftApplicationEntry[]) => void
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
	const [entries, setEntries] = useState<DraftApplicationEntry[]>([])
	const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const addOrUpdateEntry = (entry: DraftApplicationEntry) => {
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

	const addManyEntries = (newEntries: DraftApplicationEntry[]) => {
		setEntries((prev) => [...prev, ...newEntries])
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
				addManyEntries,
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

export function toDraftApiEntry(
	e: DraftApplicationEntry,
): BulkCreateTenantApplicationEntry {
	return {
		phone: e.phone,
		first_name: e.first_name || undefined,
		last_name: e.last_name || undefined,
		email: e.email || undefined,
		gender: e.gender || undefined,
		date_of_birth: e.date_of_birth || undefined,
		nationality: e.nationality || undefined,
		marital_status: e.marital_status || undefined,
		id_type: e.id_type || undefined,
		id_number: e.id_number || undefined,
		current_address: e.current_address || undefined,
		desired_unit_id: e.desired_unit_id || undefined,
		occupation: e.occupation || undefined,
		employer: e.employer || undefined,
	}
}
