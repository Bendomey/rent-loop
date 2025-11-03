interface RentloopDocument {
	id: string

	title: string
	content: string
	size: number
	tags: Array<string>

	property_id: string
	property?: Property

	created_by_id: string
	created_by?: ClientUser
	updated_by_id: string
	updated_by?: ClientUser

	created_at: Date
	updated_at: Date
}

interface FetchRentloopDocumentFilter {
	property_id?: string
	property_slug?: string
	tags?: Array<string>
}
