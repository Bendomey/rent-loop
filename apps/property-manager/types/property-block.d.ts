interface PropertyBlock {
	id: string
	property_id: string
	property: Nullable<Property>
	name: string
	description: Nullable<string>
	floorsCount: Nullable<number>
	unitsCount: number
	images: Array<string>
	status:
		| 'PropertyBlock.Status.Active'
		| 'PropertyBlock.Status.Inactive'
		| 'PropertyBlock.Status.Maintenance'
	created_at: Date
	updated_at: Date
}

interface FetchPropertyFilter {
	property_id?: string
	status?: string
}
