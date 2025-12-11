interface PropertyUnit {
	id: string
	property_id: string
	property: Nullable<Property>
	property_block_id: string
	property_block: Nullable<PropertyBlock>
	name: string
	description: Nullable<string>
	images: Array<string>
	area: Nullable<number>
	rent_fee: number
	rent_fee_currency: string
	payment_frequency:
		| 'WEEKLY'
		| 'DAILY'
		| 'MONTHLY'
		| 'QUARTERLY'
		| 'BIANNUALLY'
		| 'ANNUALLY'
	max_occupants_allowed: Nullable<number>
	status:
		| 'PropertyUnit.Status.Active'
		| 'PropertyUnit.Status.Inactive'
		| 'PropertyUnit.Status.Maintenance'
	created_at: Date
	updated_at: Date
}

interface FetchPropertyUnitFilter {
	property_id?: string
	property_block_id?: string
	payment_frequency?: string
	status?: string
}
