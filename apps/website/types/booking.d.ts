type BookingStatus =
	| 'PENDING'
	| 'CONFIRMED'
	| 'CHECKED_IN'
	| 'COMPLETED'
	| 'CANCELLED'
type BlockType = 'BOOKING' | 'LEASE' | 'MAINTENANCE' | 'PERSONAL' | 'OTHER'

interface PublicOutputProperty {
	id: string
	slug: string
	type: string
	status: string
	name: string
	description: Nullable<string>
	images: string[]
	tags: string[]
	latitude: number
	longitude: number
	address: string
	country: string
	region: string
	city: string
	contact_email: Nullable<string>
	client: Nullable<Client>
}

interface UnitDateBlock {
	id: string
	unit_id: string
	start_date: string
	end_date: string
	block_type: BlockType
	booking_id: Nullable<string>
	lease_id: Nullable<string>
	reason: string
	created_at: string
}

interface Booking {
	id: string
	code: string
	check_in_code: Nullable<string>
	check_in_date: string
	check_out_date: string
	checked_in_at: Nullable<string>
	checked_out_at: Nullable<string>
	rate: number
	currency: string
	status: BookingStatus
	unit_id: string
	unit: Nullable<PropertyUnit>
	property_id: string
	tenant_id: string
	tenant: Nullable<Tenant>
	property: Nullable<Property>
	canceled_at: Nullable<string>
	cancellation_reason: Nullable<string>
	invoice_id: Nullable<string>
	invoice: unknown
	meta: unknown
	created_at: string
}
