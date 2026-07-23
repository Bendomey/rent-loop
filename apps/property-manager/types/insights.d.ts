type InsightsRiskType = 'outstanding_rent' | 'expiring_leases' | 'maintenance'

interface InsightsRiskProperty {
	property_id: string
	name: string
	address: string
	// Pesewas for 'outstanding_rent', a plain count for the other two types.
	value: number
}

interface InsightsRiskPropertiesResponse {
	type: InsightsRiskType
	properties: InsightsRiskProperty[]
}
