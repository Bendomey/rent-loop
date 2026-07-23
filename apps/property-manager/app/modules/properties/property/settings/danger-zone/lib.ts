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

export function blockingReasonNote(
	type: PropertyDeletionBlockingReason['type'],
): string {
	switch (type) {
		case 'LEASE':
			return 'End or transfer each lease first'
		case 'BOOKING':
			return 'Check out or cancel to continue'
		case 'TENANT_APPLICATION':
			return 'Approve, reject or withdraw them'
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
	note: string
}

export function willBeDeletedRows(
	summary: PropertyDeletionSummary,
): WillBeDeletedRow[] {
	const rows: WillBeDeletedRow[] = [
		{
			key: 'blocks',
			icon: LayoutGrid,
			label: 'Blocks',
			count: summary.blocks,
			note: 'Becomes inactive',
		},
		{
			key: 'units',
			icon: Building2,
			label: 'Units',
			count: summary.units,
			note: 'Becomes inactive',
		},
		{
			key: 'leases',
			icon: FileText,
			label: 'Ended leases',
			count: summary.leases,
			note: 'Archived, not erased',
		},
		{
			key: 'bookings',
			icon: Calendar,
			label: 'Past bookings',
			count: summary.bookings,
			note: 'Kept for your records',
		},
		{
			key: 'applications',
			icon: UserRound,
			label: 'Closed applications',
			count: summary.tenant_applications,
			note: 'Kept for your records',
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
