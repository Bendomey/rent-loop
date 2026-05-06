package transformations

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type AdminOutputBooking struct {
	ID                     string  `json:"id"`
	Code                   string  `json:"code"`
	CheckInCode            string  `json:"check_in_code,omitempty"`
	UnitID                 string  `json:"unit_id"`
	Unit                   any     `json:"unit,omitempty"`
	PropertyID             string  `json:"property_id"`
	Property               any     `json:"property,omitempty"`
	TenantID               string  `json:"tenant_id"`
	Tenant                 any     `json:"tenant,omitempty"`
	CheckInDate            string  `json:"check_in_date"`
	CheckOutDate           string  `json:"check_out_date"`
	ConfirmedAt            *string `json:"confirmed_at,omitempty"`
	ConfirmedByID          *string `json:"confirmed_by_id,omitempty"`
	ConfirmedBy            any     `json:"confirmed_by,omitempty"`
	CheckedInAt            *string `json:"checked_in_at,omitempty"`
	CheckedInByID          *string `json:"checked_in_by_id,omitempty"`
	CheckedInBy            any     `json:"checked_in_by,omitempty"`
	CheckedOutAt           *string `json:"checked_out_at,omitempty"`
	CheckedOutByID         *string `json:"checked_out_by_id,omitempty"`
	CheckedOutBy           any     `json:"checked_out_by,omitempty"`
	Rate                   int64   `json:"rate"`
	Currency               string  `json:"currency"`
	Status                 string  `json:"status"`
	CanceledAt             *string `json:"canceled_at,omitempty"`
	CanceledByID           *string `json:"canceled_by_id,omitempty"`
	CanceledBy             any     `json:"canceled_by,omitempty"`
	CancellationReason     string  `json:"cancellation_reason,omitempty"`
	Notes                  string  `json:"notes,omitempty"`
	BookingSource          string  `json:"booking_source"`
	RequiresUpfrontPayment bool    `json:"requires_upfront_payment"`
	CreatedByClientUserID  *string `json:"created_by_client_user_id,omitempty"`
	CreatedByClientUser    any     `json:"created_by_client_user,omitempty"`
	InvoiceID              *string `json:"invoice_id,omitempty"`
	Invoice                any     `json:"invoice,omitempty"`
	Meta                   any     `json:"meta,omitempty"`
	CreatedAt              string  `json:"created_at"`
	UpdatedAt              string  `json:"updated_at"`
}

func DBBookingToRest(i *models.Booking) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":                        i.ID.String(),
		"code":                      i.Code,
		"check_in_code":             i.CheckInCode,
		"unit_id":                   i.UnitID,
		"unit":                      DBUnitToRest(&i.Unit),
		"property_id":               i.PropertyID,
		"property":                  DBPropertyToRest(&i.Property),
		"tenant_id":                 i.TenantID,
		"tenant":                    DBTenantToRest(&i.Tenant),
		"check_in_date":             i.CheckInDate,
		"check_out_date":            i.CheckOutDate,
		"confirmed_at":              i.ConfirmedAt,
		"confirmed_by_id":           i.ConfirmedByID,
		"confirmed_by":              DBClientUserToRest(i.ConfirmedBy),
		"checked_in_at":             i.CheckedInAt,
		"checked_in_by_id":          i.CheckedInByID,
		"checked_in_by":             DBClientUserToRest(i.CheckedInBy),
		"checked_out_at":            i.CheckedOutAt,
		"checked_out_by_id":         i.CheckedOutByID,
		"checked_out_by":            DBClientUserToRest(i.CheckedOutBy),
		"rate":                      i.Rate,
		"currency":                  i.Currency,
		"status":                    i.Status,
		"canceled_at":               i.CanceledAt,
		"canceled_by_id":            i.CanceledByID,
		"canceled_by":               DBClientUserToRest(i.CanceledBy),
		"cancellation_reason":       i.CancellationReason,
		"notes":                     i.Notes,
		"booking_source":            i.BookingSource,
		"requires_upfront_payment":  i.RequiresUpfrontPayment,
		"created_by_client_user_id": i.CreatedByClientUserID,
		"created_by_client_user":    DBClientUserToRest(i.CreatedByClientUser),
		"invoice_id":                i.InvoiceID,
		"invoice":                   DBInvoiceToRest(i.Invoice),
		"meta":                      i.Meta,
		"created_at":                i.CreatedAt,
		"updated_at":                i.UpdatedAt,
	}
	return data
}

type PublicOutputBooking struct {
	ID                 string               `json:"id"`
	Code               string               `json:"code"`
	CheckInCode        *string              `json:"check_in_code,omitempty"`
	CheckInDate        string               `json:"check_in_date"`
	CheckOutDate       string               `json:"check_out_date"`
	ConfirmedAt        *string              `json:"confirmed_at,omitempty"`
	CheckedInAt        *string              `json:"checked_in_at,omitempty"`
	CheckedOutAt       *string              `json:"checked_out_at,omitempty"`
	Rate               int64                `json:"rate"`
	Currency           string               `json:"currency"`
	Status             string               `json:"status"`
	UnitID             string               `json:"unit_id"`
	Unit               OutputUnit           `json:"unit,omitempty"`
	PropertyID         string               `json:"property_id"`
	TenantID           string               `json:"tenant_id"`
	Tenant             OutputTenant         `json:"tenant,omitempty"`
	Property           PublicOutputProperty `json:"property,omitempty"`
	CanceledAt         *string              `json:"canceled_at,omitempty"`
	CancellationReason *string              `json:"cancellation_reason,omitempty"`
	InvoiceID          *string              `json:"invoice_id,omitempty"`
	Invoice            any                  `json:"invoice,omitempty"`
	Meta               any                  `json:"meta,omitempty"`
	CreatedAt          string               `json:"created_at"`
}

// DBPublicBookingToRest is a reduced view for the public tracking page.
func DBPublicBookingToRest(i *models.Booking) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":                  i.ID.String(),
		"code":                i.Code,
		"check_in_code":       i.CheckInCode,
		"check_in_date":       i.CheckInDate,
		"check_out_date":      i.CheckOutDate,
		"confirmed_at":        i.ConfirmedAt,
		"checked_in_at":       i.CheckedInAt,
		"checked_out_at":      i.CheckedOutAt,
		"rate":                i.Rate,
		"currency":            i.Currency,
		"status":              i.Status,
		"unit_id":             i.UnitID,
		"unit":                DBUnitToRest(&i.Unit),
		"property_id":         i.PropertyID,
		"tenant_id":           i.TenantID,
		"tenant":              DBTenantToRest(&i.Tenant),
		"property":            DBPublicPropertyToRest(&i.Property),
		"canceled_at":         i.CanceledAt,
		"cancellation_reason": i.CancellationReason,
		"invoice_id":          i.InvoiceID,
		"invoice":             DBInvoiceToRest(i.Invoice),
		"meta":                i.Meta,
		"created_at":          i.CreatedAt,
	}
	return data
}
