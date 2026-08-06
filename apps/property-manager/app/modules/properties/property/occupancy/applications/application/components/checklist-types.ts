export interface ChecklistItem {
	label: string
	done: boolean
	/**
	 * Nice to have, but it does not hold the step back. An optional item still
	 * shows its state in the rail; it just never blocks the section from
	 * completing or the application from being approved.
	 */
	optional?: boolean
}
