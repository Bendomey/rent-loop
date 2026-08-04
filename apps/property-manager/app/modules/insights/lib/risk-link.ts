// Where clicking a record in a risk drill-down should send the manager — the
// record's own detail page, where they can act on it. Every risk category
// resolves to a property-scoped route, which is why propertyId is required.
export function getRiskRecordPath(
	type: InsightsRiskType,
	propertyId: string,
	recordId: string,
): string {
	switch (type) {
		case 'maintenance':
			return `/properties/${propertyId}/activities/maintenance-requests/${recordId}`
		case 'expiring_leases':
			return `/properties/${propertyId}/occupancy/leases/${recordId}`
		case 'outstanding_rent':
			return `/properties/${propertyId}/financials/invoices/${recordId}`
	}
}
