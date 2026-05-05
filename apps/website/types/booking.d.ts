type BookingStatus =
	| 'PENDING'
	| 'CONFIRMED'
	| 'CHECKED_IN'
	| 'COMPLETED'
	| 'CANCELLED'
type BlockType = 'BOOKING' | 'LEASE' | 'MAINTENANCE' | 'PERSONAL' | 'OTHER'

interface PublicBookingProperty {
	id: string
	name: string
	slug: string
	contact_email: Nullable<string>
}

interface PublicBookingUnit {
	id: string
	name: string
	description: Nullable<string>
	images: Array<string>
	rent_fee: number
	rent_fee_currency: string
	slug: string
	property: PublicBookingProperty
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

interface PublicBooking {
	id: string
	code: string
	tracking_code: string
	check_in_code: string
	check_in_date: string
	check_out_date: string
	rate: number
	currency: string
	status: BookingStatus
	cancellation_reason: Nullable<string>
	unit: PublicBookingUnit
}

interface CreatePublicBookingInput {
	check_in_date: string
	check_out_date: string
	first_name: string
	last_name: string
	phone: string
	email: string
	id_number: string
}
