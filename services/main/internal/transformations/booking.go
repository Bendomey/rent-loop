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
	TenantID               string  `json:"tenant_id"`
	Tenant                 any     `json:"tenant,omitempty"`
	CheckInDate            string  `json:"check_in_date"`
	CheckOutDate           string  `json:"check_out_date"`
	Rate                   int64   `json:"rate"`
	Currency               string  `json:"currency"`
	Status                 string  `json:"status"`
	CancellationReason     string  `json:"cancellation_reason,omitempty"`
	Notes                  string  `json:"notes,omitempty"`
	BookingSource          string  `json:"booking_source"`
	RequiresUpfrontPayment bool    `json:"requires_upfront_payment"`
	CreatedByClientUserID  *string `json:"created_by_client_user_id,omitempty"`
	InvoiceID              *string `json:"invoice_id,omitempty"`
	Invoice                any     `json:"invoice,omitempty"`
	CreatedAt              string  `json:"created_at"`
	UpdatedAt              string  `json:"updated_at"`
}

func DBBookingToRest(i *models.Booking) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	// Only expose check-in code once confirmed
	checkInCode := ""
	if i.Status == "CONFIRMED" || i.Status == "CHECKED_IN" || i.Status == "COMPLETED" {
		checkInCode = i.CheckInCode
	}

	data := map[string]any{
		"id":                        i.ID.String(),
		"code":                      i.Code,
		"check_in_code":             checkInCode,
		"unit_id":                   i.UnitID,
		"unit":                      DBAdminUnitToRest(&i.Unit),
		"property_id":               i.PropertyID,
		"tenant_id":                 i.TenantID,
		"tenant":                    DBAdminTenantToRest(&i.Tenant),
		"check_in_date":             i.CheckInDate,
		"check_out_date":            i.CheckOutDate,
		"rate":                      i.Rate,
		"currency":                  i.Currency,
		"status":                    i.Status,
		"cancellation_reason":       i.CancellationReason,
		"notes":                     i.Notes,
		"booking_source":            i.BookingSource,
		"requires_upfront_payment":  i.RequiresUpfrontPayment,
		"created_by_client_user_id": i.CreatedByClientUserID,
		"invoice_id":                i.InvoiceID,
		"invoice":                   DBInvoiceToRest(i.Invoice),
		"created_at":                i.CreatedAt,
		"updated_at":                i.UpdatedAt,
	}
	return data
}

type PublicOutputBooking struct {
	Code         string `json:"code"`
	CheckInCode  string `json:"check_in_code,omitempty"`
	CheckInDate  string `json:"check_in_date"`
	CheckOutDate string `json:"check_out_date"`
	Rate         int64  `json:"rate"`
	Currency     string `json:"currency"`
	Status       string `json:"status"`
	UnitName     string `json:"unit_name,omitempty"`
	PropertyName string `json:"property_name,omitempty"`
	CreatedAt    string `json:"created_at"`
}

// DBPublicBookingToRest is a reduced view for the public tracking page.
// It omits internal IDs and only exposes the check-in code when confirmed.
func DBPublicBookingToRest(i *models.Booking) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	checkInCode := ""
	if i.Status == "CONFIRMED" || i.Status == "CHECKED_IN" || i.Status == "COMPLETED" {
		checkInCode = i.CheckInCode
	}

	unitName := ""
	if i.Unit.ID != uuid.Nil {
		unitName = i.Unit.Name
	}
	propertyName := ""
	if i.Property.ID != uuid.Nil {
		propertyName = i.Property.Name
	}

	data := map[string]any{
		"code":           i.Code,
		"check_in_code":  checkInCode,
		"check_in_date":  i.CheckInDate,
		"check_out_date": i.CheckOutDate,
		"rate":           i.Rate,
		"currency":       i.Currency,
		"status":         i.Status,
		"unit_name":      unitName,
		"property_name":  propertyName,
		"created_at":     i.CreatedAt,
	}
	return data
}
