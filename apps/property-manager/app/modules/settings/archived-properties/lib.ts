import {
	Building2,
	Calendar,
	FileText,
	LayoutGrid,
	UserRound,
	type LucideIcon,
} from 'lucide-react'

interface RestoreRow {
	key: string
	icon: LucideIcon
	label: string
	count: number
}

export function restorePreviewRows(
	preview: PropertyRestorePreview,
): RestoreRow[] {
	const rows: RestoreRow[] = [
		{ key: 'blocks', icon: LayoutGrid, label: 'Blocks', count: preview.blocks },
		{ key: 'units', icon: Building2, label: 'Units', count: preview.units },
		{
			key: 'leases',
			icon: FileText,
			label: 'Ended leases',
			count: preview.leases,
		},
		{
			key: 'bookings',
			icon: Calendar,
			label: 'Past bookings',
			count: preview.bookings,
		},
		{
			key: 'applications',
			icon: UserRound,
			label: 'Closed applications',
			count: preview.tenant_applications,
		},
	]
	return rows.filter((row) => row.count > 0)
}
