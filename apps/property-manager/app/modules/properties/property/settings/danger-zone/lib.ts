import {
	Building2,
	Calendar,
	FileText,
	LayoutGrid,
	UserRound,
	type LucideIcon,
} from 'lucide-react'

export function blockingReasonIcon(
	type: PropertyDeletionBlockingReason['type'],
): LucideIcon {
	switch (type) {
		case 'LEASE':
			return FileText
		case 'BOOKING':
			return Calendar
		case 'TENANT_APPLICATION':
			return UserRound
	}
}

export function blockingReasonResolvePath(
	propertyId: string,
	reason: PropertyDeletionBlockingReason,
): string {
	const status = encodeURIComponent(reason.status)
	switch (reason.type) {
		case 'LEASE':
			return `/properties/${propertyId}/occupancy/leases?filters=status&status=${status}`
		case 'BOOKING':
			return `/properties/${propertyId}/occupancy/bookings?filters=status&status=${status}`
		case 'TENANT_APPLICATION':
			return `/properties/${propertyId}/occupancy/applications?filters=status&status=${status}`
	}
}

interface WillBeDeletedRow {
	key: string
	icon: LucideIcon
	label: string
	count: number
}

export function willBeDeletedRows(
	summary: PropertyDeletionSummary,
): WillBeDeletedRow[] {
	const rows: WillBeDeletedRow[] = [
		{ key: 'blocks', icon: LayoutGrid, label: 'Blocks', count: summary.blocks },
		{ key: 'units', icon: Building2, label: 'Units', count: summary.units },
		{
			key: 'leases',
			icon: FileText,
			label: 'Ended leases',
			count: summary.leases,
		},
		{
			key: 'bookings',
			icon: Calendar,
			label: 'Past bookings',
			count: summary.bookings,
		},
		{
			key: 'applications',
			icon: UserRound,
			label: 'Closed applications',
			count: summary.tenant_applications,
		},
	]
	return rows.filter((row) => row.count > 0)
}

export function willBeDeletedTotal(summary: PropertyDeletionSummary): number {
	return (
		summary.blocks +
		summary.units +
		summary.leases +
		summary.bookings +
		summary.tenant_applications
	)
}
