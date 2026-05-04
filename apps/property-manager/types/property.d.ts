interface Property {
	id: string
	client_id: string
	slug: string
	name: string
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
	modes: Array<'LEASE' | 'BOOKING'>
	booking_requires_upfront_payment: boolean
	created_at: Date
	updated_at: Date
}

interface FetchPropertyFilter {
	type?: string
	status?: string
	tags?: Array<string>
	ids?: Array<string>
}
