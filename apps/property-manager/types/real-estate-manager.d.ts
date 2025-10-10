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
	zip_code: string
	created_at: Date
	updated_at: Date
}
