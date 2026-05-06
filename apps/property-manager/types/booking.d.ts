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
	check_in_code: Nullable<string>
	unit_id: string
	unit?: PropertyUnit
	property_id: string
	property: Nullable<Property>
	tenant_id: string
	tenant: Nullable<Tenant>
	check_in_date: Date
	check_out_date: Date
	confirmed_at: Nullable<Date>
	confirmed_by_id: Nullable<string>
	confirmed_by: Nullable<ClientUser>
	checked_in_at: Nullable<Date>
	checked_in_by_id: Nullable<string>
	checked_in_by: Nullable<ClientUser>
	checked_out_at: Nullable<Date>
	checked_out_by_id: Nullable<string>
	checked_out_by: Nullable<ClientUser>
	rate: number
	currency: string
	status: BookingStatus
	canceled_at: Nullable<Date>
	canceled_by_id: Nullable<string>
	canceled_by: Nullable<ClientUser>
	cancellation_reason: Nullable<string>
	notes: Nullable<string>
	booking_source: BookingSource
	requires_upfront_payment: boolean
	created_by_client_user_id: Nullable<string>
	created_by_client_user: Nullable<ClientUser>
	invoice_id: Nullable<string>
	invoice: Nullable<Invoice>
	meta: Nullable<Record<string, unknown>>
	created_at: Date
	updated_at: Date
}

// type AdminOutputBooking struct {
// 	ID                     string  `json:"id"`
// 	Code                   string  `json:"code"`
// 	CheckInCode            string  `json:"check_in_code,omitempty"`
// 	UnitID                 string  `json:"unit_id"`
// 	Unit                   any     `json:"unit,omitempty"`
// 	PropertyID             string  `json:"property_id"`
// 	Property               any     `json:"property,omitempty"`
// 	TenantID               string  `json:"tenant_id"`
// 	Tenant                 any     `json:"tenant,omitempty"`
// 	CheckInDate            string  `json:"check_in_date"`
// 	CheckOutDate           string  `json:"check_out_date"`
// 	ConfirmedAt            *string `json:"confirmed_at,omitempty"`
// 	ConfirmedByID          *string `json:"confirmed_by_id,omitempty"`
// 	ConfirmedBy            any     `json:"confirmed_by,omitempty"`
// 	CheckedInAt            *string `json:"checked_in_at,omitempty"`
// 	CheckedInByID          *string `json:"checked_in_by_id,omitempty"`
// 	CheckedInBy            any     `json:"checked_in_by,omitempty"`
// 	CheckedOutAt           *string `json:"checked_out_at,omitempty"`
// 	CheckedOutByID         *string `json:"checked_out_by_id,omitempty"`
// 	CheckedOutBy           any     `json:"checked_out_by,omitempty"`
// 	Rate                   int64   `json:"rate"`
// 	Currency               string  `json:"currency"`
// 	Status                 string  `json:"status"`
// 	CanceledAt             *string `json:"canceled_at,omitempty"`
// 	CanceledByID           *string `json:"canceled_by_id,omitempty"`
// 	CanceledBy             any     `json:"canceled_by,omitempty"`
// 	CancellationReason     string  `json:"cancellation_reason,omitempty"`
// 	Notes                  string  `json:"notes,omitempty"`
// 	BookingSource          string  `json:"booking_source"`
// 	RequiresUpfrontPayment bool    `json:"requires_upfront_payment"`
// 	CreatedByClientUserID  *string `json:"created_by_client_user_id,omitempty"`
// 	CreatedByClientUser    any     `json:"created_by_client_user,omitempty"`
// 	InvoiceID              *string `json:"invoice_id,omitempty"`
// 	Invoice                any     `json:"invoice,omitempty"`
// 	Meta                   any     `json:"meta,omitempty"`
// 	CreatedAt              string  `json:"created_at"`
// 	UpdatedAt              string  `json:"updated_at"`
// }

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
