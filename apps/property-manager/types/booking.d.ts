type BookingStatus =
	| 'PENDING'
	| 'CONFIRMED'
	| 'CHECKED_IN'
	| 'COMPLETED'
	| 'CANCELLED'

type BookingSource = 'MANAGER' | 'GUEST_LINK'

type BlockType = 'BOOKING' | 'LEASE' | 'MAINTENANCE' | 'PERSONAL' | 'OTHER'

interface Booking {
	id: string
	code: string
	tracking_code: string
	check_in_code: string
	unit_id: string
	unit: PropertyUnit
	property_id: string
	tenant_id: string
	tenant: Tenant
	check_in_date: Date
	check_out_date: Date
	rate: number
	currency: string
	status: BookingStatus
	cancellation_reason: string
	notes: string
	booking_source: BookingSource
	requires_upfront_payment: boolean
	created_by_client_user_id: Nullable<string>
	invoice_id: Nullable<string>
	invoice: Nullable<Invoice>
	created_at: Date
	updated_at: Date
}

interface UnitDateBlock {
	id: string
	unit_id: string
	start_date: Date
	end_date: Date
	block_type: BlockType
	booking_id: Nullable<string>
	lease_id: Nullable<string>
	reason: string
	created_at: Date
}

interface FetchBookingFilter {
	status?: BookingStatus
	unit_id?: string
}
