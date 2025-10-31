interface Property {
	id: string
	name: string
	description: string | NullableString
	address: string
	gps_address: string
	city: string
	state: string
	type: 'SINGLE' | 'MULTI'
	status:
		| 'Property.Status.Active'
		| 'Property.Status.Inactive'
		| 'Property.Status.Maintenance'
	zip_code: string
	tags: string[]
	created_at: Date
	updated_at: Date
}
