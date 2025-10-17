interface RealEstateManager {
	id: string
	name: string
	email: string
	created_at: Date
	updated_at: Date
	properties: Array<Property>
}

interface Property {
	id: string
	name: string
	address: string
	city: string
	state: string
	type: 'SINGLE' | 'MULTI'
	status: 'ClientUser.Status.Active' | 'ClientUser.Status.Inactive' | 'ClientUser.Status.Maintenance'
	zip_code: string
	created_at: Date
	updated_at: Date
}
