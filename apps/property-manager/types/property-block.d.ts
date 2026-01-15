interface PropertyBlock {
	id: string
	property_id: string
	property: Nullable<Property>
	name: string
	description: Nullable<string>
	floors_count: Nullable<number>
	units_count: number
	images: Array<string>
	status:
		| 'PropertyBlock.Status.Active'
		| 'PropertyBlock.Status.Inactive'
		| 'PropertyBlock.Status.Maintenance'
	created_at: Date
	updated_at: Date
}

interface FetchPropertyBlockFilter {
	status?: string
	ids?: Array<string>
}
