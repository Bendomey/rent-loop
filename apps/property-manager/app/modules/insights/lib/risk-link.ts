// Where clicking a property for a risk category should send the manager —
// the table where they can actually act on that risk category. Shared by
// RiskDetailModal (one row per affected property) and RiskSummaryCard (which
// skips the modal and navigates straight here when scoped to one property).
export function getRiskLinkPath(
	type: InsightsRiskType,
	propertyId: string,
): string {
	switch (type) {
		case 'maintenance':
			return `/properties/${propertyId}/activities/maintenance-requests`
		case 'expiring_leases':
		case 'outstanding_rent':
			return `/properties/${propertyId}/occupancy/leases`
	}
}
