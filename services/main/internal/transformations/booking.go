package transformations

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

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
		"tracking_code":             i.TrackingCode,
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
		"tracking_code":  i.TrackingCode,
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
