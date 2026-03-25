export const PRIORITY_STYLES: Record<MaintenanceRequestPriority, string> = {
	LOW: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
	MEDIUM:
		'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
	HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
	EMERGENCY: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export const PRIORITY_LABELS: Record<MaintenanceRequestPriority, string> = {
	LOW: 'Low',
	MEDIUM: 'Medium',
	HIGH: 'High',
	EMERGENCY: 'Emergency',
}

export const CATEGORY_LABELS: Record<MaintenanceRequestCategory, string> = {
	PLUMBING: 'Plumbing',
	ELECTRICAL: 'Electrical',
	HVAC: 'HVAC',
	OTHER: 'Other',
}
