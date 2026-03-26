import { AlertTriangle, CheckCircle, Clock, User } from 'lucide-react'

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

export const getStatusConfig = (status: MaintenanceRequest['status']) => {
	switch (status) {
		case 'NEW':
			return {
				variant: 'secondary' as const,
				icon: AlertTriangle,
				color: 'text-orange-600',
				label: 'New',
			}
		case 'IN_PROGRESS':
			return {
				variant: 'default' as const,
				icon: Clock,
				color: 'text-blue-600',
				label: 'In Progress',
			}
		case 'IN_REVIEW':
			return {
				variant: 'outline' as const,
				icon: User,
				color: 'text-purple-600',
				label: 'In Review',
			}
		case 'RESOLVED':
			return {
				variant: 'default' as const,
				icon: CheckCircle,
				color: 'text-green-600',
				label: 'Resolved',
			}
		case 'CANCELED':
			return {
				variant: 'destructive' as const,
				icon: AlertTriangle,
				color: 'text-red-600',
				label: 'Canceled',
			}
		default:
			return {
				variant: 'secondary' as const,
				icon: AlertTriangle,
				color: 'text-gray-600',
				label: status,
			}
	}
}
