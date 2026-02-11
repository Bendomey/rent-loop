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
	features: Nullable<StringRecord>
	payment_frequency:
		| 'WEEKLY'
		| 'DAILY'
		| 'MONTHLY'
		| 'QUARTERLY'
		| 'BIANNUALLY'
		| 'ANNUALLY'
	max_occupants_allowed: Nullable<number>
	type: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'OFFICE' | 'RETAIL'
	status: 'Unit.Status.Available' | 'Unit.Status.Unavailable'
	created_at: Date
	updated_at: Date
}

interface FetchPropertyUnitFilter {
	block_ids?: Array<string>
	ids?: Array<string>
}
