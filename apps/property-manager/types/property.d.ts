interface Property {
	id: string
	slug: string
	name: string
	slug: string
	description: Nullable<string>
	address: string
	gps_address: string
	country: string
	region: string
	city: string
	state: string
	type: 'SINGLE' | 'MULTI'
	status:
		| 'Property.Status.Active'
		| 'Property.Status.Inactive'
		| 'Property.Status.Maintenance'
	zip_code: string
	image: string[]
	tags: string[]
	created_at: Date
	updated_at: Date
}

interface FetchPropertyFilter {
	type?: string
	status?: string
	tags?: Array<string>
}
