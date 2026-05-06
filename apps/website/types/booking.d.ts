type BookingStatus =
	| 'PENDING'
	| 'CONFIRMED'
	| 'CHECKED_IN'
	| 'COMPLETED'
	| 'CANCELLED'
type BlockType = 'BOOKING' | 'LEASE' | 'MAINTENANCE' | 'PERSONAL' | 'OTHER'

interface Property {
	id: string
	name: string
	slug: string
	contact_email: Nullable<string>
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
	tracking_code: string
	check_in_code: string
	check_in_date: string
	check_out_date: string
	rate: number
	currency: string
	status: BookingStatus
	cancellation_reason: Nullable<string>
	unit: PropertyUnit
}
